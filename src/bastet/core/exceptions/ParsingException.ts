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

import {ParserRuleContext, Token} from "antlr4ts";

export class ParsingException extends Error {

    private readonly _node: ParserRuleContext;

    private readonly _cause: string;

    constructor(cause: string, node: ParserRuleContext) {
        const start = ParsingException.toPositionString(node.start);
        const end = ParsingException.toPositionString(node.stop);
        super(`Check the syntax of the input program. ${cause}\n Code between ${start} and ${end}`);
        this._node = node;
        this._cause = cause;
    }

    get cause(): string {
        return this._cause;
    }

    get node(): ParserRuleContext {
        return this._node;
    }

    private static toPositionString(token: Token) {
        return `(line ${token.line}, pos ${token.charPositionInLine})`;
    }

}
