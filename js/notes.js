class Note extends DataRow {

    constructor(data) {
        super(data)
        this.broadcast_channel = new BroadcastChannel('note_channel_' + this.id)
        this.broadcast_channel.onmessage = (ev) => {
            const textarea = this.get("input")
            textarea.html(ev.data).val(ev.data).trigger("change")

            if (this.data.find("button.note-show-button svg").hasClass("fa-angle-up")) {
                // If the note is opened, update the summernote field
                textarea.summernote("code", textarea.val())
            }
        }
    }

    toggle_show_button(show = true) {
        const svg = this.data.find("button.note-show-button svg")
        const text_area = this.data.find("textarea.summernote")
        if (show) {
            text_area.summernote(summernote_cfg)
            svg.removeClass("fa-angle-down").addClass("fa-angle-up")
        } else {
            svg.addClass("fa-angle-down").removeClass("fa-angle-up")
        }
    }

    destroy_summernote() {
        this.data.find("textarea.summernote").summernote('destroy')
    }

    open_window() {
        const new_window = window.open("", "note_dialog_" + this.id,
            "height=600,width=600,status=yes,toolbar=yes,menubar=yes,location=yes")

        if (new_window.location.href === "about:blank") {
            // Add the libraries in the dialog
            new_window.document.write(window.document.head.innerHTML)

            // Set note-specific data
            const textarea = this.get("body").clone(false, false)
            textarea.find(".note-editor").remove()
            new_window.document.write(textarea.get(0).innerHTML)
            new_window.document.write("<" + "script>" + "const note_dialog_channel = " + "\"note_channel_" + this.id + "\";"
                + "let summernote_cfg = " + JSON.stringify(summernote_cfg) + ";"
                + "<" + "/script>")

            // Copy js for the dialog
            new_window.document.write($("#script-note-dialog").get(0).outerHTML)
        }
        // Set the title
        const title = this.get("name").val()
        new_window.document.title = title ? this.get("name").val() : "Note"
    }
}

function row_show() {
    row_of(this).toggle_show_button(true)
}

function row_hide() {
    row_of(this).toggle_show_button(false)
}

function row_clean() {
    row_of(this).destroy_summernote()
}

class NoteTable extends DataTable {
    static row_class = Note

    open_window() {
        row_of(this).open_window()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        add_save_to_dom_listeners(row.data)
        add_summernote_listeners(row.data)
        row.data.find(".note-body").uon('show.bs.collapse', row_show)
            .uon('hide.bs.collapse', row_hide)
            .uon('hidden.bs.collapse', row_clean)
        row.get("external").uon("click", this.open_window)
    }

    clone_row() {
        return this.template_row.clone(true, false)
    }

    remove_row(event) {
        super.remove_row(event)
        compute_remaining_ap()
    }
}

$("#note-search").on("keyup", event => {
    let value = $(event.target).val().toLowerCase()
    $(".rpg-note").each((i, elem) => {
        if (elem.id !== "note-x") {
            const title = $(elem).find(".note-name").val().toLowerCase()
            const content = $(elem).find("textarea.summernote").val().toLowerCase()
            if (title.includes(value) || content.includes(value)) {
                $(elem).removeClass("d-none")
            } else {
                $(elem).addClass("d-none")
            }
        }
    })
})

$(_ => {
    new NoteTable($("#note-table"))
})
