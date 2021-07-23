$(_ => {
    // Recovers the content inside the textarea and build a WYSWYG GUI
    $('#background').summernote(summernote_cfg)
    add_summernote_listeners()
})
