#include "parser/parser.h"
#include <algorithm>

namespace code_reader {

struct Parser::Impl {};

Parser::Parser() : impl_(std::make_unique<Impl>()) {}
Parser::~Parser() = default;

ParseResult Parser::parse(const std::string& content, const std::string& /*language*/) {
    ParseResult result;
    result.content = content;
    return result;
}

void Parser::Register(Napi::Env env, Napi::Object& exports) {
    (void)env;
    (void)exports;
}

}  // namespace code_reader
