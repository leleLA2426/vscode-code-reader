#pragma once
#include "parser.h"

namespace code_reader {

class FoldingProvider {
public:
    static std::vector<FoldRange> compute(const ParseResult& parse_result);
};

}  // namespace code_reader
