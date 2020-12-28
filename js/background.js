$(_ => {
    // Recovers the content inside the textarea and build a WYSWYG GUI
    $('#background').summernote({
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['hr', 'link', 'picture', 'video']],
            ['view', ['fullscreen', 'undo', 'redo']],
        ],
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
        lang: 'fr-FR',
        placeholder: 'Historique'
    })
})

$('#background').on('summernote.change', (we, contents, $editable) => {
    // Copy to textarea
    $("#background").html(contents)
    changed_page = true
});
