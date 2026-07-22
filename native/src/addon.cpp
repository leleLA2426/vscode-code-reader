#include <napi.h>
#include "parser/parser.h"

namespace cr = code_reader;

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    cr::Parser::Register(env, exports);
    return exports;
}

NODE_API_MODULE(code_reader_native, Init)
