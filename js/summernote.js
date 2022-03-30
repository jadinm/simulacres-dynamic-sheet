const summernote_cfg = {
    toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'underline', 'clear']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['emoji', 'hr', 'link', 'picture', 'video']],
        ['view', ['fullscreen', 'undo', 'redo']]
    ],
    buttons: {
        emoji: EmojiButton
    },
    popover: {
        image: [
            ['image', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
            ['float', ['floatLeft', 'floatRight', 'floatNone']],
            ['remove', ['removeMedia']]
        ],
        link: [
            ['link', ['linkDialogShow', 'unlink']]
        ],
        table: [
            ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
            ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
        ],
        air: [
            ['color', ['color']],
            ['font', ['bold', 'underline', 'clear']],
            ['para', ['ul', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture']]
        ]
    },
    fontNames: ['Augusta'],
    dialogsFade: true,
    tabDisable: true,
    lang: 'fr-FR'
}

function summer_note_listener(we, contents) {
    // Copy to textarea
    $(we.target).html(contents)
    mark_page_changed()
}

function EmojiButton(context) {
    const ui = $.summernote.ui;
    const buttonGroup = ui.buttonGroup([
        ui.button({
            className: 'dropdown-toggle',
            contents: '<i class="far fa-smile"/>',
            tooltip: 'Insérer un emoji',
            data: {
                toggle: 'dropdown'
            },
            click: function (_) {
                // Cursor position must be saved because is lost when dropdown is opened.
                context.invoke('editor.saveRange')
            }
        }),
        ui.dropdown({
            className: 'dropdown-style',
            contents: "<emoji-picker></emoji-picker>",
            callback: function (dropdown) {
                dropdown.on("click", (e) => {
                    e.stopPropagation() // Prevent closing of the dropdown
                })
                dropdown.children().first().on("emoji-click", event => {
                    context.invoke("editor.restoreRange")
                    context.invoke("editor.focus")
                    context.invoke("editor.insertText", event.detail.unicode)
                })
            }
        })
    ]);
    return buttonGroup.render();
}
