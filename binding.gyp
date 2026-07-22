{
  "targets": [
    {
      "target_name": "code-reader-native",
      "sources": [
        "native/src/addon.cpp",
        "native/src/parser/parser.cpp",
        "native/src/parser/symbolExtractor.cpp",
        "native/src/parser/foldingProvider.cpp"
      ],
      "include_dirs": [
        "D:/colin/vibe coding/code-reader/node_modules/node-addon-api",
        "native/src"
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
