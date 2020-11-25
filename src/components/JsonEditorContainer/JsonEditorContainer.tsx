import React, { useEffect, useRef } from "react";
import JSONEditor, { EditableNode, JSONEditorOptions, MenuItem, MenuItemNode, Template } from "jsoneditor";
import "./JsonEditorContainer.scss";
import { addNode, removeNode } from '../../validator/Validator';

const cretaValidInsertMenu = (submenu: MenuItem[] | undefined, validInsertItems: any) => {
    const validMenuItems: MenuItem[] = [];

    if (submenu === undefined || submenu.length === 0) {
        return undefined;
    }

    submenu?.forEach(subItem => {
        if (validInsertItems !== undefined && validInsertItems.length !== 0) {
            Object.keys(validInsertItems).forEach((key: any) => {
                if (subItem.text === key && subItem.title === validInsertItems[key].description) {
                    validMenuItems.push(subItem);
                }
            });
        }
    });

    return validMenuItems;
}

export function JsonEditorContainer(props: { json: any, templates: Template[] }): JSX.Element {
    const jsonEditorElm = useRef<HTMLDivElement | null>(null);
    const jsonEditorInstance = useRef<JSONEditor | null>(null);

    const options: JSONEditorOptions = {
        mode: 'tree',
        templates: props.templates,
        onError: (err: any) => {
            console.log(err.toString())
        },
        onCreateMenu: (menuItems: MenuItem[], node: MenuItemNode) => {
            const paths = node.paths[0];
            // get parant Path for add function
            const parantPaths: string[] = [...node.paths[0]]
            parantPaths.pop()

            const isRemoveValid = removeNode(props.json, [...paths]);
            const validInsertItems = Object(addNode([...parantPaths]).resultNode?.data);
            const validMenuItems: MenuItem[] = [];

            // if removeNode validation returns error
            // Remove default Remove(Delete) function
            if (isRemoveValid.error) {
                menuItems = menuItems.filter(item => item.text !== "Remove")
            }

            // Creating a new MenuItem array that only contains valid items
            // and replace submenu with valid items
            menuItems.forEach(item => {
                if (item.text === "Insert") {
                    item.submenu?.forEach(subItem => {
                        if (validInsertItems !== undefined && validInsertItems.length !== 0) {
                            Object.keys(validInsertItems).forEach((key: any) => {
                                if (subItem.text === key && subItem.title === validInsertItems[key].description) {
                                    validMenuItems.push(subItem);
                                }
                            });
                        }
                    });
                    item.submenu = validMenuItems;
                }
                // adding samw logic to Append
                if (item.text === "Append") {
                    item.submenu?.forEach(subItem => {
                        if (validInsertItems !== undefined && validInsertItems.length !== 0) {
                            Object.keys(validInsertItems).forEach((key: any) => {
                                if (subItem.text === key && subItem.title === validInsertItems[key].description) {
                                    validMenuItems.push(subItem);
                                }
                            });
                        }
                    });
                    item.submenu = validMenuItems;
                }
            });

            return menuItems;
        },
        onEvent: (node: EditableNode, event: any) => {
            if (node.field !== undefined) {
                // console.log(event, node);
                if (event.type === "click") {
                    // console.log(event.type + ' event ' +
                    //     'on value ' + JSON.stringify(node.value) + ' ' +
                    //     'at path ' + JSON.stringify(node.path)
                    // )
                }
            }
        },
        onChange: function (...params) {
            console.log('change', params);
        },
        onModeChange: (mode: any) => {
            const domElement = jsonEditorElm.current;
            if (domElement) {
                const treeMode: HTMLElement | null = domElement.querySelector('#treeModeSelection')
                const textMode: HTMLElement | null = domElement.querySelector('#textModeSelection')

                if (textMode && treeMode) {
                    treeMode.style.display = textMode.style.display = 'none'

                    if (mode === 'code' || mode === 'text') {
                        textMode.style.display = 'inline'
                    } else {
                        treeMode.style.display = 'inline'
                    }
                }
            }
        },
        indentation: 4,
        escapeUnicode: true,
        onTextSelectionChange: (start: any, end: any, text: string) => {
            const domElement = jsonEditorElm.current;
            if (domElement) {
                const rangeEl = domElement.querySelector('#textRange');
                const textEl = domElement.querySelector('#selectedText');
                if (rangeEl) {
                    rangeEl.innerHTML = 'start: ' + JSON.stringify(start) + ', end: ' + JSON.stringify(end);
                }
                if (textEl) {
                    textEl.innerHTML = text;
                }
            }
        },
        onSelectionChange: function (start: any, end: any) {
            const domElement = jsonEditorElm.current;
            if (domElement) {
                const nodesEl = domElement.querySelector('#selectedNodes');
                if (nodesEl) {
                    nodesEl.innerHTML = '';
                    if (start) {
                        nodesEl.innerHTML = ('start: ' + JSON.stringify(start));
                        if (end) {
                            nodesEl.innerHTML += ('<br/>end: ' + JSON.stringify(end));
                        }
                    }
                }
            }
        }
    }

    useEffect(() => {
        if (jsonEditorElm.current !== null) {
            // create the editor
            const container = jsonEditorElm.current;
            jsonEditorInstance.current = new JSONEditor(container, options);
        }
    }, []);

    useEffect(() => {
        const editor = jsonEditorInstance.current;
        if (editor) {
            editor.set(props.json);
        }
    }, [props.json]);


    return (<div className="json-editor-container" ref={jsonEditorElm} />);
}
