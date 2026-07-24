#include "parser/foldingProvider.h"
#include <tree_sitter/api.h>

namespace code_reader {

std::vector<FoldRange> FoldingProvider::compute(const ParseResult& /*parse_result*/) {
    // Folds are computed inline during the AST walk in Parser::parse().
    // This method is kept for external use (future).
    return {};
}

}  // namespace code_reader