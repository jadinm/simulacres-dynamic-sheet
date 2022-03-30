// Note: select pickers that are not multiple but for which you want to be able
//       to easily unselect should be declared with attributes: <select [...] data-max-options="1" multiple></select>

function update_numeric_input_select(select, input_selector) {
    select = $(select)
    if (select.length === 0)
        return
    select = select[0]

    let only_at_levels = select.getAttribute("data-filter-current-level")
    if (only_at_levels != null)
        only_at_levels = only_at_levels.split(",")
    const elements = input_selector.filter((i, elem) => {
        return only_at_levels == null || only_at_levels.includes(elem.value)
    }).map((i, elem) => {
        /* Recover image if any */
        let new_image = Characteristics.build_svg_image(elem.id)

        /* Find energy name, either in a tooltip, in the label, in a side input
         * or in the id without other alternative
         */
        const div = $(elem).parents("[title]").first()
        let name = div.attr("title")
        if (!name || name.length === 0)
            name = div.attr("data-original-title")
        if (!name || name.length === 0) {
            name = $("label[for=\"" + elem.id + "\"").text()
            if (name)
                name = name.trim()
        }
        if (!name || name.length === 0) {
            name = $("#\"" + elem.id + "-label\"").val()
            if (name)
                name = name.trim()
        }
        if (!name || name.length === 0)
            name = elem.id

        /* Have content */
        let content = ""
        if (new_image)
            content += new_image + "&nbsp;"
        content += name
        return {name: name, content: content, value: elem.id}
    })
    update_select($(select), elements)
}

function update_spell_select(select) {
    let only_at_levels = select.getAttribute("data-filter-current-level")
    if (only_at_levels != null)
        only_at_levels = only_at_levels.split(",")
    let exclude_spell_lists = select.getAttribute("data-filter-out-list")
    if (exclude_spell_lists != null)
        exclude_spell_lists = exclude_spell_lists.split(',')
    let include_spell_lists = select.getAttribute("data-filter-list")
    if (include_spell_lists != null)
        include_spell_lists = include_spell_lists.split(',')
    let no_realm = select.getAttribute("data-no-realm-id")

    const elements = sheet["spells"].rows.filter((spell) => {
        return spell.name
            && (exclude_spell_lists == null || !spell.list || !exclude_spell_lists.includes(spell.list))
            && (include_spell_lists == null || !spell.list || include_spell_lists.includes(spell.list))
    }).map((spell) => {
        // Get spell difficulties of each realm
        if (!no_realm) {
            return Characteristics.realms.filter((realm) => spell.formula_elem("realm", realm)[1])
                .map((realm) => {
                    const realm_svg = Characteristics.build_svg_image(realm)
                    const spell_level = spell.get_difficulty(realm)
                    if (only_at_levels == null || only_at_levels.includes(spell_level.toString())) {
                        let content = sanitize(spell.name) + "&nbsp;" + realm_svg
                        return {name: spell.name, content: content, value: spell.id + "-" + realm}
                    } else {
                        return null
                    }
                }).filter((elem) => elem != null)
        }
        return {name: spell.name, content: null, value: spell.id}
    }).flat()
    update_select($(select), $(elements))
}

function get_selected_options(select, new_value, old_value) {
    const is_template = select[0].id.includes("-x-")

    // Find the selected option
    let selected_options = !is_template ? select.selectpicker('val') : []
    if (!Array.isArray(selected_options))
        selected_options = [selected_options]
    selected_options = $(selected_options).map((i, elem) => {
        if (elem === old_value) { // Update selection based on the changed value
            elem = new_value
        }
        return elem
    }).toArray().flat()
    return selected_options
}

function update_select(select, elements, new_value, old_value) {
    const is_template = select[0].id.includes("-x-")

    // Find the selected option
    let selected_options = get_selected_options(select, new_value, old_value)
    select.empty()

    // Sort it
    $(elements).sort((a, b) => {
        return a.name.localeCompare(b.name) // Sort correctly accents
    }).each((i, elem) => {
        const value = (elem.hasOwnProperty("value") ? elem.value : elem.name)
        let new_option = "<option value=\"" + value + "\""
        if (elem.content) {// Custom data-content (like images)
            new_option += " data-content='" + elem.content.replaceAll("'", "&apos;") + "'"
        }
        if (selected_options.includes(value)) // Keep selection
            new_option += " selected='selected'"
        new_option += ">" + elem.name + "</option>"
        select.append(new_option)
    })

    if (!is_template) {// Ignore template lines
        select.selectpicker("refresh")
    }
    mark_page_changed()
}

/**
 * Update the select options based on a talent list
 */
function update_talent_select(select, new_value, old_value) {
    // Recover talent list, potentially filtered
    const only_from = select[0].getAttribute("data-talent-filter-origin-level")
    let only_at_levels = select[0].getAttribute("data-talent-filter-current-level")
    if (only_at_levels != null)
        only_at_levels = only_at_levels.split(",")
    const talent_list = sheet.talents().filter((talent) => {
        return talent.name
            && (only_from == null || talent.base_level === only_from)
            && (only_at_levels == null || only_at_levels.includes(talent.talent_level()))
    }).map((talent) => {
        return {name: talent.name, content: null}
    })
    update_select(select, $(talent_list), new_value, old_value)
}

function select_change(e) {
    if (e.target.id.includes("-x-"))
        return
    const value = $(e.target).selectpicker('val')
    let current_value = value
    if (!Array.isArray(current_value))
        current_value = [current_value]
    $(e.target).children().each((i, elem) => { // Save results in DOM
        elem.removeAttribute('selected')
        if (current_value.includes(elem.value)) {
            $(e.target).children()[i].setAttribute('selected', 'selected')
        }
    })
    mark_page_changed()
    return value
}
