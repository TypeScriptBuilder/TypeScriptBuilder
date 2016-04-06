import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import * as uix from "./uix";
import * as commands from "./commands/commands";
import CodeMirror = require('codemirror');
import Modal = require('react-modal');
import {server} from "../socket/socketClient";
import {Types} from "../socket/socketContract";
import {modal} from "./styles/styles";
import {Robocop} from "./robocop";
import * as docCache from "./codemirror/mode/docCache";
import {CodeEditor} from "./codemirror/codeEditor";
import {RefactoringsByFilePath, Refactoring} from "../common/types";

// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.format] = (editor: CodeMirror.EditorFromTextArea) => {
    let doc = editor.getDoc();
    let filePath = editor.filePath;
    if (doc.somethingSelected()){
        var selection = doc.listSelections()[0]; // only the first is formatted at the moment
        let from = selection.anchor;
        let to = selection.head;
        server.formatDocumentRange({
            from,to,filePath
        }).then(res=> {
            uix.API.applyRefactorings(res.refactorings);
        });
    }
    else {
        server.formatDocument({
            filePath
        }).then(res=> {
            uix.API.applyRefactorings(res.refactorings);
        });
    }
}
