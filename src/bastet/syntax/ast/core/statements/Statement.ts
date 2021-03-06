/*
 *   BASTET Program Analysis and Verification Framework
 *
 *   Copyright 2020 by University of Passau (uni-passau.de)
 *
 *   See the file CONTRIBUTORS.md for the list of contributors.
 *
 *   Please make sure to CITE this work in your publications if you
 *   build on this work. Some of our maintainers or contributors might
 *   be interested in actively CONTRIBUTING to your research project.
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

import {AbstractNode, AstNode} from "../../AstNode";
import {AstNodeList} from "../../AstNodeList";

export abstract class Statement extends AbstractNode {

    constructor(childs: AstNode[]) {
        super(childs);
    }

}

export class StatementLists {

    public static concat(list1: StatementList, list2: StatementList): StatementList {
        return new StatementList(list1.elements.concat(list2.elements));
    }

}

export class StatementList extends AstNodeList<Statement> {

    private readonly _isAtomic: boolean;

    constructor(elements: Statement[], isAtomic: boolean = false) {
        super(elements);
        this._isAtomic = isAtomic;
    }

    get isAtomic(): boolean {
        return this._isAtomic;
    }

    private static readonly EMPTY_STATEMENTLIST: StatementList = new StatementList([]);

    public static empty(): StatementList {
        return this.EMPTY_STATEMENTLIST;
    }

    static from(statements: Statement[]) {
        return new StatementList(statements);
    }
}

export interface NonPreemptive {

}

/**
 * The execution of the statements in supposed to be not interleaved
 * with other statements from other scripts.
 */
export class NonPreemptiveBlockStatement extends AbstractNode implements Statement, NonPreemptive {

    private readonly _statements: StatementList;

    constructor(statements: StatementList) {
        super([statements]);
        this._statements = statements;
    }

    get statements(): StatementList {
        return this._statements;
    }

}

/**
 * All statements that are combined by this statement into
 * one are supposed to be executed in one time step on
 * the machine and READ the SAME DATA, also from VOLATILE variables!
 */
export class SingleStepBlockStatement extends NonPreemptiveBlockStatement {

    constructor(statements: StatementList) {
        super(statements);
    }

}
