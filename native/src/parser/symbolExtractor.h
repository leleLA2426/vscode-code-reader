#pragma once
#include "parser.h"

namespace code_reader {

class SymbolExtractor {
public:
    static std::vector<std::unique_ptr<SymbolNode>> extract(const ParseResult& parse_result);
};

}  // namespace code_reader
