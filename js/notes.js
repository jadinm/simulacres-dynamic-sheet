class Note extends DataRow {

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

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        add_save_to_dom_listeners(row.data)
        add_summernote_listeners(row.data)
        row.data.find(".note-body").uon('show.bs.collapse', row_show)
            .uon('hide.bs.collapse', row_hide)
            .uon('hidden.bs.collapse', row_clean)
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
