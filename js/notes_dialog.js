let bc = null
if (typeof note_dialog_channel !== "undefined") {
    bc = new BroadcastChannel(note_dialog_channel)

    $("textarea.summernote").summernote(summernote_cfg).off('summernote.change').on('summernote.change', (we, contents) => {
        $(we.target).html(contents)
        bc.postMessage(contents)
    })

    $(".note-editor").get(0).style.height = "100%"
}
