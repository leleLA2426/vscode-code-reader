#pragma once
#include <tree_sitter/api.h>
#include <string>
#include <unordered_map>
#include <memory>

namespace code_reader {

class GrammarRegistry {
public:
    GrammarRegistry();
    ~GrammarRegistry();

    TSParser* createParser(const std::string& language);
    bool hasLanguage(const std::string& language) const;

private:
    std::unordered_map<std::string, const TSLanguage*> grammars_;
    void registerGrammar(const std::string& name, const TSLanguage* lang);
};

}  // namespace code_reader