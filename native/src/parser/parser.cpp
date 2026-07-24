#include "parser/parser.h"
#include "parser/grammar_registry.h"
#include "parser/symbolExtractor.h"
#include "parser/foldingProvider.h"
#include <napi.h>
#include <tree_sitter/api.h>
#include <mutex>
#include <unordered_set>
#include <functional>
#include <cstring>

namespace code_reader {

struct Parser::Impl {
    std::unique_ptr<GrammarRegistry> registry;
    std::mutex parse_mutex;
    Impl() : registry(std::make_unique<GrammarRegistry>()) {}
};

Parser::Parser() : impl_(std::make_unique<Impl>()) {}
Parser::~Parser() = default;

static std::string vscodeLangToTreeSitter(const std::string& lang) {
    if (lang == "cpp") return "cpp";
    if (lang == "javascriptreact") return "javascriptreact";
    if (lang == "typescriptreact") return "typescriptreact";
    if (lang == "typescript") return "typescript";
    if (lang == "javascript") return "javascript";
    if (lang == "python") return "python";
    if (lang == "c") return "c";
    return "";
}

static std::string nodeTypeToTokenType(
    const std::string& node_type,
    const std::string& parent_type
) {
    // Comment
    if (node_type == "comment" || node_type == "line_comment" ||
        node_type == "block_comment" || node_type == "doc_comment")
        return "comment";

    // String
    if (node_type == "string" || node_type == "string_literal" ||
        node_type == "string_content" || node_type == "string_fragment" ||
        node_type == "template_string" || node_type == "template_substitution" ||
        node_type == "raw_string_literal" || node_type == "interpreted_string_literal" ||
        node_type == "escape_sequence" || node_type == "template_content")
        return "string";

    // Number
    if (node_type == "number" || node_type == "number_literal" ||
        node_type == "float" || node_type == "integer" ||
        node_type == "float_literal" || node_type == "integer_literal" ||
        node_type == "hex_literal" || node_type == "oct_literal" || node_type == "bin_literal")
        return "number";

    // Keywords (all languages)
    static const std::unordered_set<std::string> keywords = {
        "return", "break", "continue", "goto", "case", "default", "sizeof",
        "struct", "union", "enum", "typedef",
        "primitive_type", "sized_type_specifier",
        "storage_class_specifier", "type_qualifier",
        "preproc_include", "preproc_def", "preproc_if", "preproc_else",
        "preproc_endif", "preproc_ifdef", "preproc_elif",
        "preproc_function_def", "preproc_call", "preproc_arg",
        "def", "class", "if", "elif", "else", "for", "while", "break", "pass",
        "import", "from", "as", "try", "except", "finally", "raise", "with", "lambda",
        "and", "or", "not", "in", "is", "yield", "assert", "del", "global", "nonlocal",
        "function", "const", "let", "var", "type", "interface",
        "export", "async", "await", "catch", "throw", "switch",
        "typeof", "instanceof", "new", "this", "super", "extends", "implements",
        "public", "private", "protected", "static", "readonly", "abstract",
        "namespace", "module", "declare", "keyof", "infer",
        "null", "undefined", "true", "false",
    };
    if (keywords.count(node_type)) return "keyword";

    // Operators and punctuation
    static const std::unordered_set<std::string> ops = {
        "=", "+", "-", "*", "/", "%", "<", ">", "!", "&", "|", "^",
        ".", ",", ":", ";", "?", "(", ")", "[", "]", "{", "}",
        "==", "!=", "<=", ">=", "&&", "||", "=>", "++", "--",
        "+=", "-=", "*=", "/=",
    };
    if (ops.count(node_type)) return "keyword";

    // Identifiers
    if (node_type == "identifier" || node_type == "property_identifier") {
        static const std::unordered_set<std::string> func_parents = {
            "function_declaration", "function_definition", "method_definition",
            "arrow_function", "function", "call_expression"
        };
        static const std::unordered_set<std::string> class_parents = {
            "class_declaration", "class_definition", "new_expression"
        };
        if (func_parents.count(parent_type)) return "function";
        if (class_parents.count(parent_type)) return "class";
        return "variable";
    }

    if (node_type == "type_identifier") return "class";

    return "text";
}

ParseResult Parser::parse(const std::string& content, const std::string& language) {
    ParseResult result;
    result.content = content;

    std::string ts_lang = vscodeLangToTreeSitter(language);
    if (ts_lang.empty()) return result;

    std::lock_guard<std::mutex> lock(impl_->parse_mutex);

    TSParser* ts_parser = impl_->registry->createParser(ts_lang);
    if (!ts_parser) return result;

    TSTree* tree = ts_parser_parse_string(
        ts_parser, nullptr,
        content.c_str(),
        static_cast<uint32_t>(content.size())
    );

    if (!tree) {
        ts_parser_delete(ts_parser);
        return result;
    }

    TSNode root = ts_tree_root_node(tree);

    std::function<void(TSNode)> walk = [&](TSNode node) {
        uint32_t count = ts_node_child_count(node);
        if (count == 0) {
            Token t;
            t.start_byte = ts_node_start_byte(node);
            t.end_byte   = ts_node_end_byte(node);
            TSPoint start = ts_node_start_point(node);
            t.line = start.row;
            TSNode parent = ts_node_parent(node);
            const char* ptype = (parent.id != nullptr) ? ts_node_type(parent) : "";
            t.type = nodeTypeToTokenType(ts_node_type(node), ptype);
            result.tokens.push_back(std::move(t));
        } else {
            TSPoint start = ts_node_start_point(node);
            TSPoint end   = ts_node_end_point(node);
            // Only fold if the range is substantial (>1 line of content)
            if (end.row > start.row + 1) {
                const char* ntype = ts_node_type(node);
                // Only fold code blocks, not preprocessor / imports / small statements
                bool is_block = (
                    strcmp(ntype, "compound_statement") == 0 ||
                    strcmp(ntype, "function_definition") == 0 ||
                    strcmp(ntype, "function_declaration") == 0 ||
                    strcmp(ntype, "class_definition") == 0 ||
                    strcmp(ntype, "class_declaration") == 0 ||
                    strcmp(ntype, "method_definition") == 0 ||
                    strcmp(ntype, "struct_specifier") == 0 ||
                    strcmp(ntype, "union_specifier") == 0 ||
                    strcmp(ntype, "enum_specifier") == 0 ||
                    strcmp(ntype, "if_statement") == 0 ||
                    strcmp(ntype, "for_statement") == 0 ||
                    strcmp(ntype, "while_statement") == 0 ||
                    strcmp(ntype, "switch_statement") == 0 ||
                    strcmp(ntype, "block") == 0 ||
                    strcmp(ntype, "module") == 0 ||
                    strcmp(ntype, "try_statement") == 0 ||
                    strcmp(ntype, "except_clause") == 0 ||
                    strcmp(ntype, "with_statement") == 0 ||
                    strcmp(ntype, "interface_declaration") == 0 ||
                    strcmp(ntype, "object_type") == 0 ||
                    strcmp(ntype, "statement_block") == 0 ||
                    strcmp(ntype, "declaration_list") == 0
                );
                if (is_block) {
                    FoldRange fold;
                    fold.start_line = start.row;
                    fold.end_line   = end.row;
                    result.fold_ranges.push_back(fold);
                }
            }
            for (uint32_t i = 0; i < count; ++i) {
                walk(ts_node_child(node, i));
            }
        }
    };

    walk(root);
    result.symbols = SymbolExtractor::extract(root, content);

    ts_tree_delete(tree);
    ts_parser_delete(ts_parser);
    return result;
}

static std::vector<size_t> buildByteToCharMap(const std::string& utf8) {
    std::vector<size_t> map(utf8.size() + 1);
    size_t charIdx = 0;
    for (size_t i = 0; i < utf8.size(); ++i) {
        map[i] = charIdx;
        if ((static_cast<unsigned char>(utf8[i]) & 0xC0) != 0x80) ++charIdx;
    }
    map[utf8.size()] = charIdx;
    return map;
}

class ParseWorker : public Napi::AsyncWorker {
public:
    ParseWorker(Napi::Promise::Deferred deferred,
                std::string content,
                std::string language)
        : Napi::AsyncWorker(deferred.Env()),
          deferred_(std::move(deferred)),
          content_(std::move(content)),
          language_(std::move(language)) {}

    void Execute() override {
        Parser p;
        result_ = p.parse(content_, language_);
    }

    void OnOK() override {
        Napi::Env env = Env();
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("content", Napi::String::New(env, result_.content));

        auto byteToChar = buildByteToCharMap(content_);

        Napi::Array tokens = Napi::Array::New(env, result_.tokens.size());
        for (size_t i = 0; i < result_.tokens.size(); ++i) {
            Napi::Object t = Napi::Object::New(env);
            t.Set("startByte", Napi::Number::New(env, byteToChar[result_.tokens[i].start_byte]));
            t.Set("endByte",   Napi::Number::New(env, byteToChar[result_.tokens[i].end_byte]));
            t.Set("line",      Napi::Number::New(env, result_.tokens[i].line));
            t.Set("type",      Napi::String::New(env, result_.tokens[i].type));
            tokens.Set(i, t);
        }
        obj.Set("tokens", tokens);

        Napi::Array folds = Napi::Array::New(env, result_.fold_ranges.size());
        for (size_t i = 0; i < result_.fold_ranges.size(); ++i) {
            Napi::Object f = Napi::Object::New(env);
            f.Set("startLine", Napi::Number::New(env, result_.fold_ranges[i].start_line));
            f.Set("endLine",   Napi::Number::New(env, result_.fold_ranges[i].end_line));
            folds.Set(i, f);
        }
        obj.Set("folds", folds);

        obj.Set("symbols", buildSymbols(env, result_.symbols));
        deferred_.Resolve(obj);
    }

private:
    Napi::Promise::Deferred deferred_;
    std::string content_;
    std::string language_;
    ParseResult result_;

    static Napi::Array buildSymbols(
        Napi::Env env,
        const std::vector<std::unique_ptr<SymbolNode>>& nodes
    ) {
        Napi::Array arr = Napi::Array::New(env, nodes.size());
        for (size_t i = 0; i < nodes.size(); ++i) {
            Napi::Object s = Napi::Object::New(env);
            s.Set("name",      Napi::String::New(env, nodes[i]->name));
            s.Set("kind",      Napi::String::New(env, nodes[i]->kind));
            s.Set("startLine", Napi::Number::New(env, nodes[i]->start_line));
            s.Set("endLine",   Napi::Number::New(env, nodes[i]->end_line));
            s.Set("children",  buildSymbols(env, nodes[i]->children));
            arr.Set(i, s);
        }
        return arr;
    }
};

void Parser::Register(Napi::Env env, Napi::Object& exports) {
    exports.Set("parseFile", Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
        Napi::Env env = info.Env();
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
            Napi::TypeError::New(env, "Expected (content: string, language: string)")
                .ThrowAsJavaScriptException();
            return env.Undefined();
        }
        std::string content  = info[0].As<Napi::String>().Utf8Value();
        std::string language = info[1].As<Napi::String>().Utf8Value();

        auto deferred = Napi::Promise::Deferred::New(env);
        auto* worker = new ParseWorker(std::move(deferred), std::move(content), std::move(language));
        worker->Queue();
        return deferred.Promise();
    }));
}

}  // namespace code_reader