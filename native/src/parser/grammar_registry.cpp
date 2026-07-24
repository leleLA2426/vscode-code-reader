#include "parser/grammar_registry.h"

extern "C" {
    const TSLanguage* tree_sitter_typescript();
    const TSLanguage* tree_sitter_tsx();
    const TSLanguage* tree_sitter_python();
    const TSLanguage* tree_sitter_c();
}

namespace code_reader {

GrammarRegistry::GrammarRegistry() {
    registerGrammar("typescript",      tree_sitter_typescript());
    registerGrammar("javascript",      tree_sitter_typescript());
    registerGrammar("javascriptreact", tree_sitter_tsx());
    registerGrammar("typescriptreact", tree_sitter_tsx());
    registerGrammar("python",          tree_sitter_python());
    registerGrammar("c",               tree_sitter_c());
    registerGrammar("cpp",             tree_sitter_c());
}

GrammarRegistry::~GrammarRegistry() = default;

void GrammarRegistry::registerGrammar(const std::string& name, const TSLanguage* lang) {
    grammars_[name] = lang;
}

TSParser* GrammarRegistry::createParser(const std::string& language) {
    auto it = grammars_.find(language);
    if (it == grammars_.end()) return nullptr;
    TSParser* parser = ts_parser_new();
    ts_parser_set_language(parser, it->second);
    return parser;
}

bool GrammarRegistry::hasLanguage(const std::string& language) const {
    return grammars_.find(language) != grammars_.end();
}

}  // namespace code_reader