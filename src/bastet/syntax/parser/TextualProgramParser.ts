/*
 *   BASTET Program Analysis and Verification Framework
 *
 *   Copyright 2019 by University of Passau (uni-passau.de)
 *
 *   Maintained by Andreas Stahlbauer (firstname@lastname.net)
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

import {BailErrorStrategy, CharStreams, CommonTokenStream, TokenStream} from 'antlr4ts';
import {ScratchLexer} from "./grammar/ScratchLexer";
import {ProgramContext, ScratchParser} from "./grammar/ScratchParser";
import fs from "fs";
import path from "path";
import {ProgramParser} from "./ProgramParser";
import {Preconditions} from "../../utils/Preconditions";
import {IllegalArgumentException} from "../../core/exceptions/IllegalArgumentException";
import {ParsingException} from "../../core/exceptions/ParsingException";

class MyScratchCoreParser extends ScratchParser {

    constructor(input: TokenStream) {
        super(input);
        this._errHandler = new BailErrorStrategy();
    }

    get errorHandler(): BailErrorStrategy {
        return this._errHandler as BailErrorStrategy;
    }

}

export class TextualProgramParser implements ProgramParser {

    public parseFile(filepath: string): ProgramContext {
        Preconditions.checkNotEmpty(filepath);

        const basename = path.basename(filepath);
        const sourcecode : string = fs.readFileSync(filepath, 'utf8');

        Preconditions.checkNotEmpty(sourcecode, "Empty source file");

        return this.parseSource(basename, sourcecode);
    }

    /**
     * Create an transformers AST for a given scratch program.
     *
     * @param basename
     * @param sourcecode
     */
    public parseSource(basename: string, sourcecode: string): ProgramContext {
        // Create a character stream and the lexer
        const inputStream = CharStreams.fromString(sourcecode);
        const lexer = new ScratchLexer(inputStream);
        const tokenStream = new CommonTokenStream(lexer);

        // Create the parser
        const parser = new MyScratchCoreParser(tokenStream);

        // Parse the program and construct the AST
        try {
            return parser.program();

        } catch (e) {
            throw new ParsingException("Parsing failed! Please make sure that the input program adheres to the grammar.", e.cause.ctx);
        }
    }

}
