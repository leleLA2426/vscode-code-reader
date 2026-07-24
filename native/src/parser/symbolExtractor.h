#pragma once
#include "parser.h"
#include <tree_sitter/api.h>

namespace code_reader {

class SymbolExtractor {
public:
    static std::vector<std::unique_ptr<SymbolNode>> extract(
        TSNode root, const std::string& content);
};

}  // namespace code_reader