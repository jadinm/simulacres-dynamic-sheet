realms = /mineral|vegetal|animal|natural|humanoid|mechanical|artificial|void|supernatural/

class RollRow extends DataRow {

    realm(realm_based_div) {
        const realm_split = $(realm_based_div)[0].id.split("-")
        const realm = realm_split[realm_split.length - 1]
        return realm.match(realms) ? realm : ""
    }

    formula_elem(element, fixed_realm = null) {
        const elem_name = this.id + "-" + element
        let checked_elem = $("input[name=" + elem_name + "]:checked")
        if (element === "realm" && fixed_realm != null)
            checked_elem = checked_elem.filter("[id*=\"-" + fixed_realm + "\"]")
        if (checked_elem.length === 0)
            return [0, $()]  // Allow partial formulas
        const base_array = checked_elem[0].id.split("-")
        const formula_base_name = base_array[base_array.length - 1]
        let bonus = 0
        if (formula_base_name === "resistance" && is_hobbit()) {
            bonus += 1 // Hobbits have an increased resistance
        }
        if (!(this instanceof SuperpowerRow)) {
            const components = SuperpowerRollTable.components()
            if (components.includes(formula_base_name))
                bonus += 4 // Super heroes have bonuses on all tests based on their component power
        }
        return [bonus + parseInt($("#" + formula_base_name).val()), checked_elem]
    }

    compute_formula(fixed_realm = null) {
        const elements = ["component", "means", "realm"]
        let sum = 0
        const checked_elements = []
        for (let i = 0; i < elements.length; i++) {
            const ret = this.formula_elem(elements[i], fixed_realm)
            sum += ret[0]
            if (ret[1].length > 0)
                checked_elements.push(ret[1])
        }
        return [sum, checked_elements]
    }

    cap_roll_value(sum) {
        // Optional min and max
        const min = parseInt(this.get("details-min").val())
        if (!isNaN(min)) {
            if (isNaN(sum))
                sum = min
            else
                sum = Math.max(min, sum)
        }
        const max = parseInt(this.get("details-max").val())
        if (!isNaN(max) && !isNaN(sum))
            sum = Math.min(max, sum)
        return sum
    }

    update_roll_value() {
        let sum = 0

        // Recover component, means and realm
        const formula = this.compute_formula()[0]
        sum += formula

        // Add talent if any
        let talent = this.get("talent")
        if (talent.length === 0)
            return
        talent = talent.val()

        const bonus = this.get("details-bonus")
        if (bonus.length > 0 && !isNaN(parseInt(bonus.val()))) {
            sum += parseInt(bonus.val())
        }

        const talent_div = talent_from_name(talent)
        if (talent.length !== 0 && talent_div.length !== 0) {
            const level = talent_level(talent_div[0])
            if (level === "x")
                sum = "X"
            else
                sum += parseInt(level)
        }

        // Dual wielding: check tap talent level for penalty
        let tap_talent = this.get("tap-talent")
        tap_talent = tap_talent.val()
        if (tap_talent) {
            const tap_talent_div = talent_from_name(tap_talent)
            if (tap_talent_div.length === 0)
                sum = "X"
            else {
                const level = talent_level(tap_talent_div[0])
                if (level === "x")
                    sum = "X"
                else // Fixed penalty of using dual wielding
                    sum += Math.min(parseInt(level) - 2, 0)
            }
        }

        // Optional min and max
        sum = this.cap_roll_value(sum)

        // Unease is applied at the end
        if (!isNaN(sum))
            sum += get_unease()

        // Update
        this.get("value").text(sum)
        this.get("dice")[0].removeAttribute("hidden")
    }

    roll_reason() {
        const talent = this.get("talent").find("option:selected").val()
        const tap_talent_select = this.get("tap-talent")
        if (tap_talent_select.length > 0) {
            const tap_talent = tap_talent_select.find("option:selected").val()
            return "Combat à deux armes: " + talent + " & " + tap_talent
        }
        return talent
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        let critical_increase = 0
        const formula_elements = this.compute_formula()[1]
        let margin_throttle = NaN
        const talent_select = this.get("talent")
        const talent = talent_select.find("option:selected").val()
        difficulty = parseInt(talent_level(talent_from_name(talent)))

        // Dual wielding
        const tap_talent_select = this.get("tap-talent")
        if (tap_talent_select.length > 0) {
            critical_increase += 1
        }
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Do the actual roll
        const value = parseInt(this.get("value").text())
        new TalentRoll(this.roll_reason(), value, difficulty, this.get("effect").val(),
            critical_increase, formula_elements, margin_throttle, false, false,
            "", "").trigger_roll()
        $('#roll-dialog').modal()
    }
}

class TalentRollTable extends DataTable {
    static row_class = RollRow

    trigger_roll(event) {
        // Find the real target of the click
        let button = $(event.target)
        if (!button.hasClass("row-roll-trigger"))
            button = $(event.target).parents(".row-roll-trigger")
        row_of(button).roll(button)
    }

    formula_changed(e) {
        e.preventDefault()
        row_of(e.target).update_roll_value()
    }

    select_changed(e) {
        row_of(e.target).update_roll_value()
    }

    view_details(_) {
        const row = row_of(this)
        const formula = row.compute_formula()[1]
        let title = "<h2>" + row.roll_reason() + "</h2>"
        if (formula.length > 0) {
            title += "<h4>"
            for (let i = 0; i < formula.length; i++) {
                const symbol = $("label[for='" + formula[i][0].id + "'] svg").first().clone(false, false)
                if (symbol.length > 0) {
                    symbol.removeClass("input-prefix")
                    title += symbol.get(0).outerHTML
                    if (i !== formula.length - 1)
                        title += "&nbsp;+&nbsp;"
                }
            }
            title += "</h4>"
        }
        row.get("details-title").html(title)
        let text = ""
        const focus = row.get("time")
        if (focus.length > 0)
            text += "Concentration: " + focus.val() + "<br/>"
        const distance = row.get("distance")
        if (distance.length > 0)
            text += "Portée: " + distance.val() + "<br/>"
        const duration = row.get("duration")
        if (duration.length > 0)
            text += "Durée: " + duration.val() + "<br/>"
        const effect = row.get("effect")
        if (effect.length > 0)
            text += "Effet: " + effect.val()
        row.get("details-effect").html(text)
        row.get("details").modal()
    }

    update_value(e) {
        row_of(e.target).update_roll_value()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        add_save_to_dom_listeners(row.data)
        row.data.find(".row-roll-trigger").uon("click", this.trigger_roll)
        row.data.find(".formula-elem").uon("change", this.formula_changed)
        row.data.find("select").uon("changed.bs.select", this.select_changed)
        row.data.find("select.talent-select").each((i, elem) => {
            $(elem).selectpicker()
        })
        row.get("show-details").uon("click", this.view_details).tooltip()
        row.get("details-bonus").uon("change", this.update_value)
        row.get("details-min").uon("change", this.update_value)
        row.get("details-max").uon("change", this.update_value)
        if (row.get("tap-talent").length > 0) {
            check_radio(row.get("body")[0])
            check_radio(row.get("action")[0])
            check_radio(row.get("mechanical")[0])
            row.data.find(".formula-elem").attr("disabled", "disabled")
            row.update_roll_value()
        }
    }

    clone_row() {
        return this.template_row.clone(true, false)
    }
}

const talent_list_selector = ".talent input[id*='-name']"

/* Helper functions */

const hobbit_regexes = [/[Hh]obbits?/, /[Tt]inigens?/, /[Pp]etites [Gg]ens/, /[Pp]etites? [Pp]ersonnes?/,
    /[Tt]omt[eé]s?/]

function is_hobbit() {
    const race = $("#race").val()
    if (!race || race.length === 0)
        return false
    for (let i in hobbit_regexes) {
        if (race.match(hobbit_regexes[i]) != null)
            return true
    }
    return false
}

/* Triggers */

$("#race,.realm,.component,.means," + talent_list_selector).on("change", _ => {
    // Update all of the spell values
    $(".roll-value,.dual_wielding-value").each((i, elem) => {
        row_of(elem).update_roll_value()
    })
})

$(_ => {
    // Initialize spell lists
    $("select.spell-list").each((i, input) => {
        init_spell_list(input)
    })

    // Initialize tables
    new TalentRollTable($("#roll-table"))
    new TalentRollTable($("#dual_wielding-table"))
})
