#include "parser/symbolExtractor.h"
#include <tree_sitter/api.h>
#include <cstring>

namespace code_reader {

// Recursively search for the first name/identifier node in a subtree
static std::string findName(TSNode node, const std::string& content) {
    const char* ntype = ts_node_type(node);
    if (strcmp(ntype, "identifier") == 0 ||
        strcmp(ntype, "property_identifier") == 0 ||
        strcmp(ntype, "name") == 0) {
        uint32_t start = ts_node_start_byte(node);
        uint32_t end   = ts_node_end_byte(node);
        return content.substr(start, end - start);
    }
    uint32_t count = ts_node_child_count(node);
    for (uint32_t i = 0; i < count; ++i) {
        std::string name = findName(ts_node_child(node, i), content);
        if (!name.empty()) return name;
    }
    return "";
}

static std::unique_ptr<SymbolNode> buildSymbol(TSNode node, const std::string& content) {
    const char* ntype = ts_node_type(node);
    std::string kind;

    if (strcmp(ntype, "function_declaration") == 0 ||
        strcmp(ntype, "function_definition") == 0) {
        kind = "function";
    } else if (strcmp(ntype, "method_definition") == 0) {
        kind = "method";
    } else if (strcmp(ntype, "class_declaration") == 0 ||
               strcmp(ntype, "class_definition") == 0 ||
               strcmp(ntype, "struct_specifier") == 0 ||
               strcmp(ntype, "union_specifier") == 0 ||
               strcmp(ntype, "enum_specifier") == 0) {
        kind = "class";
    } else if (strcmp(ntype, "interface_declaration") == 0) {
        kind = "interface";
    } else if (strcmp(ntype, "variable_declaration") == 0 ||
               strcmp(ntype, "lexical_declaration") == 0) {
        kind = "variable";
    } else {
        return nullptr;
    }

    std::string name = findName(node, content);
    if (name.empty()) return nullptr;

    auto sym = std::make_unique<SymbolNode>();
    sym->name = name;
    sym->kind = kind;
    sym->start_line = ts_node_start_point(node).row;
    sym->end_line   = ts_node_end_point(node).row;

    // Recurse into children for nested symbols (methods inside classes, etc.)
    TSNode body = ts_node_child_by_field_name(node, "body", 4);
    if (body.id == nullptr) {
        body = ts_node_child_by_field_name(node, "children", 8);
    }
    if (body.id != nullptr) {
        uint32_t bc = ts_node_child_count(body);
        for (uint32_t i = 0; i < bc; ++i) {
            TSNode bchild = ts_node_child(body, i);
            auto nested = buildSymbol(bchild, content);
            if (nested) {
                sym->children.push_back(std::move(nested));
            }
        }
    }

    return sym;
}

std::vector<std::unique_ptr<SymbolNode>> SymbolExtractor::extract(
    TSNode root, const std::string& content
) {
    std::vector<std::unique_ptr<SymbolNode>> symbols;
    uint32_t count = ts_node_child_count(root);

    for (uint32_t i = 0; i < count; ++i) {
        TSNode child = ts_node_child(root, i);
        auto sym = buildSymbol(child, content);
        if (sym) {
            symbols.push_back(std::move(sym));
        }
    }

    return symbols;
}

}  // namespace code_reader