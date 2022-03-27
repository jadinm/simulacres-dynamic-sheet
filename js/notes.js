class Note extends DataRow {
    static basic_inputs = ["name"]
    static text_areas = ["input"]

    constructor(data, opts = {}, other_html = null, created = true) {
        super(data, opts, other_html, created)
        this.broadcast_channel = new BroadcastChannel('note_channel_' + this.id)
        this.broadcast_channel.onmessage = (ev) => {
            const textarea = this.get("input")
            textarea.val(ev.data).trigger("change")

            if (this.find("button.note-show-button svg").hasClass("fa-angle-up")) {
                // If the note is opened, update the summernote field
                textarea.summernote("code", textarea.val())
            }
        }
    }

    toggle_show_button(show = true) {
        const svg = this.find("button.note-show-button svg")
        const text_area = this.find("textarea.summernote")
        if (show) {
            text_area.summernote(summernote_cfg)
            svg.removeClass("fa-angle-down").addClass("fa-angle-up")
        } else {
            svg.addClass("fa-angle-down").removeClass("fa-angle-up")
        }
    }

    destroy_summernote() {
        this.find("textarea.summernote").summernote('destroy')
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
                + "<" + "/script>")
            new_window.document.write($("#script-summernote").get(0).outerHTML)

            // Set dark mode
            if (is_dark_mode()) {
                new_window.document.write("<" + "script>"
                    + "let dark_theme = " + JSON5.stringify(dark_theme) + ";"
                    + "let dark_fixes = " + JSON5.stringify(dark_fixes) + ";"
                    + "<" + "/script>")
            }

            // Copy js for the dialog
            new_window.document.write($("#script-note-dialog").get(0).outerHTML)
        }
        // Set the title
        new_window.document.title = this["name"] ? this["name"] : "Note"
    }

    add_listeners() {
        super.add_listeners()

        if (!this.is_template()) {
            this.find(".note-body").on('show.bs.collapse', () => this.toggle_show_button(true))
                .on('hide.bs.collapse', () => this.toggle_show_button(false))
                .on('hidden.bs.collapse', () => this.destroy_summernote())
            this.get("external").on("click", () => this.open_window())
        }
    }
}

class NoteTable extends DataList {
    static row_class = Note

    clone_row() {
        return this.template_row.data.clone(true, false)
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
