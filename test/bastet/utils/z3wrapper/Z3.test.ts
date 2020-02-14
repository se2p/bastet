/*
 *   BASTET Program Analysis and Verification Framework
 *
 *   Copyright 2019 by University of Passau (uni-passau.de)
 *
 *   Maintained by Andreas Stahlbauer (firstname@lastname.net),
 *   see the file CONTRIBUTORS.md for the list of contributors.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

import {Z3_config, Z3_context} from "../../../../src/bastet/utils/z3wrapper/libz3";
import {Ptr, Uint32} from "../../../../src/bastet/utils/z3wrapper/ctypes";
import {WasmJSInstance} from "../../../../src/bastet/utils/z3wrapper/wasmInstance"
import {SolverFactory, Z3Solver} from "../../../../src/bastet/utils/z3wrapper/Z3Wrapper";

describe('Z3Wrapper', function() {

    const solver = SolverFactory.createZ3();

    it('can instantiate the WASM module', function() {
    })


});
