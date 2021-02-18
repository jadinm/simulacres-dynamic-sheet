$(_ => {
    // Initialize spell lists
    $("select.spell-list").each((i, input) => {
        init_spell_list(input)
    })

    // Super-power tables (must be defined first)
    new SuperpowerRollTable($("#superpower-table"))

    // Talent tables
    new TalentRollTable($("#roll-table"))
    new TalentRollTable($("#dual_wielding-table"))
    new CloseCombatRollTable($("#close_combat-table"))
    new RangeCombatRollTable($("#range_combat-table"))

    // Magic tables
    new SpellRollTable($("#spell-table"))
    new FocusMagicRollTable($("#focusMagic-table"))
})
