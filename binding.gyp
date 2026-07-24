{
  "targets": [
    {
      "target_name": "code-reader-native",
      "sources": [
        "native/src/addon.cpp",
        "native/src/parser/parser.cpp",
        "native/src/parser/grammar_registry.cpp",
        "native/src/parser/symbolExtractor.cpp",
        "native/src/parser/foldingProvider.cpp",
        "native/deps/tree-sitter/lib/src/lib.c",
        "native/deps/tree-sitter-c/src/parser.c",
        "native/deps/tree-sitter-python/src/parser.c",
        "native/deps/tree-sitter-python/src/scanner.c",
        "native/deps/tree-sitter-typescript/tsx/src/parser.c",
        "native/deps/tree-sitter-typescript/tsx/src/scanner.c",
        "native/deps/tree-sitter-typescript/typescript/src/parser.c",
        "native/deps/tree-sitter-typescript/typescript/src/scanner.c"
      ],
      "include_dirs": [
        "D:/colin/vibe coding/code-reader/node_modules/node-addon-api",
        "native/src",
        "native/deps/tree-sitter/lib/include",
        "native/deps/tree-sitter/lib/src",
        "native/deps/tree-sitter-c/src",
        "native/deps/tree-sitter-python/src",
        "native/deps/tree-sitter-typescript/tsx/src",
        "native/deps/tree-sitter-typescript/typescript/src",
        "native/deps/tree-sitter-typescript/common"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS==\"win\"", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": ["/std:c++17", "/utf-8"],
              "DisableSpecificWarnings": ["4244"]
            }
          }
        }],
        ["OS!=\"win\"", {
          "cflags": ["-std=c++17"]
        }]
      ]
    }
  ]
}