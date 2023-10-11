/**
 * Table UI - v0.2
 * URL: https://github.com/arhitov/javascript-submit-table
 * Author: Alexander Arhitov clgsru@gmail.com
 */
(function () {
    "use strict";

    // table.submit-table
    //      [data-request_delete="..."]
    //      [data-row_deleted_template="..."]
    //      [data-row_deleted_question_template="..."]
    // .submit-table-button-row-delete
    // .submit-table-button-row-delete-question

    class BreakError extends Error {
        constructor(message) {
            super(message);
            this.name = 'BreakError';
        }
    }

    function initTable (selfTable) {
        const thisTable = selfTable;

        function tableInsertRow(currentRow, template, id) {
            const newRowFind = thisTable.querySelector('#' + id);
            let newRow = null;
            let newRowInnerNode = null;
            if (newRowFind) {
                newRow = newRowFind;
                newRowInnerNode = newRowFind.querySelector('td');
            } else {
                const currentRowLength = currentRow.children.length;
                newRow = currentRow.closest('tbody').insertRow(currentRow.rowIndex);
                newRow.setAttribute('id', id);
                newRow.classList.add('text-center');
                newRowInnerNode = document.createElement('td');
                newRowInnerNode.setAttribute('colspan', currentRowLength);
                newRow.appendChild(newRowInnerNode);
            }

            newRowInnerNode.replaceChildren(template);
            return newRow;
        }
        function createRowTemplate(currentRow, newRowId, idntTemplate, textForNotFoundTemplate) {
            const nameTemplate = thisTable.getAttribute(idntTemplate);
            const clone = nameTemplate
                ? document.querySelector('#' + nameTemplate).content.cloneNode(true)
                : (() => {
                    const span = document.createElement('span');
                    span.innerHTML = textForNotFoundTemplate;
                    return span;
                })();
            const newRow = tableInsertRow(currentRow, clone, newRowId);
            newRow.querySelector('td').classList.remove('table-danger');
            return newRow;
        }

        function displayRowError(currentRow, newRowId, error) {
            let message;
            if (error instanceof BreakError) {
                message = error.message;
            } else {
                console.error(error);
                message = 'Frontend error: ' + error.message;
            }

            const rowInform = createRowTemplate(currentRow, newRowId, 'data-row_error_template', '');
            rowInform.querySelector('td').classList.add('table-danger');
            rowInform.querySelector('td').innerHTML = message;

            setTimeout(() => {
                rowInform.classList.add('d-none');
            }, 5000);
        }

        function displayRowSuccess(currentRow, newRowId, idntTemplate, textForNotFoundTemplate) {
            const rowInform = createRowTemplate(currentRow, newRowId, idntTemplate, textForNotFoundTemplate);
            rowInform.querySelector('td').classList.add('table-success');

            setTimeout(() => {
                rowInform.classList.add('d-none');
            }, 2000);
        }

        ([].slice.call(thisTable.querySelectorAll('.submit-table-button-row-delete'))).forEach(element => {
            element.addEventListener('click', event => {
                const id = element.closest('tr').getAttribute('data-row-id');
                const newRowId = 'submit-table-row-inform-' + id;
                const currentRow = element.closest('tr');
                (new Promise((resolve, reject) => {
                    const questionTemplate = thisTable.getAttribute('data-row_deleted_question_template');
                    if (questionTemplate) {
                        const rowInform = tableInsertRow(currentRow, document.querySelector('#' + questionTemplate).content.cloneNode(true), newRowId);
                        rowInform.classList.add('table-danger');
                        rowInform.querySelector('.submit-table-button-row-delete-question').addEventListener('click', event => {
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                }))
                    .then(() => {
                        const request_delete = thisTable.getAttribute('data-request_delete');
                        fetch(request_delete.replace(':id:', id), {
                            method: 'DELETE',
                            headers: {
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': document.head.querySelector('meta[name=csrf-token]').content,
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        })
                            .then(async response => {
                                try {
                                    return {
                                        response: response,
                                        answer: await response.json()
                                    };
                                } catch (e) {
                                    if ([200, 201, 202, 204].indexOf(response.status)) {
                                        return {
                                            response: response,
                                            answer: {

                                            }
                                        };
                                    } else {
                                        console.error(e);
                                        throw new BreakError(`${response.status} ${response.statusText} ${response.url}`);
                                    }
                                }
                            })
                            .then(data => {
                                if (data.response.ok) {
                                    return {
                                        status: data.response.status,
                                        answer: data.answer
                                    };
                                } else if (data.answer.message) {
                                    throw new BreakError(`${data.answer.message}`);
                                } else {
                                    throw new BreakError(`${data.response.status} ${data.response.statusText} ${data.response.url}`);
                                }
                            })
                            .then(() => {
                                displayRowSuccess(currentRow, newRowId, 'data-row_deleted_template', 'Row deleted!');
                                currentRow.classList.add('d-none');
                            })
                            .catch((error) => {
                                displayRowError(currentRow, newRowId, error);
                            });
                    })
                    .catch((error) => {
                        displayRowError(currentRow, newRowId, error);
                    });
            });
        });
        return {
            table: thisTable,
        };
    }

    ([].slice.call(document.querySelectorAll('.submit-table'))).forEach(element => {
        initTable(element);
    });

})();
