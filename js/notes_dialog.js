let bc = null
if (typeof note_dialog_channel !== "undefined") {
    bc = new BroadcastChannel(note_dialog_channel)

    DarkReader.disable()
    if (typeof dark_theme !== "undefined" && typeof dark_fixes !== "undefined") {
        DarkReader.enable(dark_theme, dark_fixes)
    }

    summernote_cfg.buttons = {} // XXX Disable emoji button because it does not work in external windows
    $("textarea.summernote").summernote(summernote_cfg).off('summernote.change').on('summernote.change', (we, contents) => {
        $(we.target).html(contents)
        bc.postMessage(contents)
    })
}
