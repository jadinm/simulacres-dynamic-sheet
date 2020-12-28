function toggle_show_button(note, show = true) {
    const svg = note.find("button.note-show-button svg")
    const text_area = note.find("textarea.summernote")
    if (show) {
        text_area.summernote(summernote_cfg)
        svg.removeClass("fa-angle-down").addClass("fa-angle-up")
    } else {
        svg.addClass("fa-angle-down").removeClass("fa-angle-up")
    }
}

function destroy_summernote(note) {
    note.find("textarea.summernote").summernote('destroy')
}

$("#add-note").on("click", (event, idx = null) => { // Add parameter for forced index
    const new_note = $("#note-x").clone(true, true)
    add_row($("#note-table"), new_note, idx)
    add_summernote_listeners(new_note)
    new_note.find(".note-body").on('show.bs.collapse', _ => toggle_show_button(new_note, true))
        .on('hide.bs.collapse', _ => toggle_show_button(new_note, false))
        .on('hidden.bs.collapse', _ => destroy_summernote(new_note))
})

$(".note-body").each((i, elem) => {
    $(elem).on('show.bs.collapse', _ => toggle_show_button($(elem).parent(), true))
        .on('hide.bs.collapse', _ => toggle_show_button($(elem).parent(), false))
        .on('hidden.bs.collapse', _ => destroy_summernote($(elem)))
})

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
    // Collapse all notes
    $('#note-table').each((i, elem) => {
        $(elem).find(".note-body").removeClass("show")
        toggle_show_button($(elem), false)
    })
})
