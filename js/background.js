class Background extends Model {
    static text_areas = ["background"]

    add_listeners() {
        super.add_listeners()
        this.get("background").summernote(summernote_cfg)
    }
}
