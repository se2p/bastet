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

import {ProgramAnalysis} from "./ProgramAnalysis";
import {StateSet} from "../algorithms/StateSet";
import {AbstractElement} from "../../lattices/Lattice";

export type ExportFunction = (reachedPrime: StateSet<AbstractElement>, frontierPrime: StateSet<AbstractElement>) => void;

export function resolveResultExportFunction<E extends AbstractElement>(analysis: ProgramAnalysis<any, any, any>): ExportFunction {
    const a = extractWrappedAnalysis(analysis, (a) => a['exportAnalysisResult'] != null);
    if (a) {
        return (reached, frontier) => { return a['exportAnalysisResult'](reached, frontier) };
    } else {
        return null;
    }
}

export function extractWrappedAnalysis(from: ProgramAnalysis<any, any, any>, filter: (analysis: ProgramAnalysis<any, any, any>) => boolean): ProgramAnalysis<any, any, any> {
    let it: ProgramAnalysis<any, any, any> = from;
    while (true) {
        if (!it) {
            return null;
        } else if (filter(it)) {
            return it;
        } else {
            it = it['wrappedAnalysis'];
        }
    }
}
