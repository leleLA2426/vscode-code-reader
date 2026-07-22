#pragma once
#include <napi.h>
#include <string>
#include <vector>
#include <memory>
#include <cstdint>

namespace code_reader {

struct Token {
    std::size_t start_byte;
    std::size_t end_byte;
    std::uint32_t line;
    std::string type;
};

struct SymbolNode {
    std::string name;
    std::string kind;
    std::uint32_t start_line;
    std::uint32_t end_line;
    std::vector<std::unique_ptr<SymbolNode>> children;
};

struct FoldRange {
    std::uint32_t start_line;
    std::uint32_t end_line;
};

struct ParseResult {
    std::string content;
    std::vector<Token> tokens;
    std::vector<std::unique_ptr<SymbolNode>> symbols;
    std::vector<FoldRange> fold_ranges;
};

class Parser {
public:
    Parser();
    ~Parser();

    ParseResult parse(const std::string& content, const std::string& language);

    static void Register(Napi::Env env, Napi::Object& exports);

private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};

}  // namespace code_reader
