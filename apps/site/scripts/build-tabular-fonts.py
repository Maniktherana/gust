#!/usr/bin/env python3
"""Add opt-in tabular figures to the bundled Open Runde CFF faces.

Run from any directory: python apps/site/scripts/build-tabular-fonts.py
Requires fontTools with WOFF2 support (fonttools[woff]). These assets were
built with fontTools 4.63.0 and the brotlicffi 1.2.0.0 backend. For identical
bytes, use those versions. Inputs and outputs are relative to this script,
never system-installed fonts.

The sibling LICENSE.txt permits modification under SIL OFL 1.1 and specifies
no Reserved Font Names. Keep that license with these derivatives. Original
copyright, author, version, and license metadata are retained; internal family,
full, unique, and PostScript names distinguish the modified faces.

Only appended glyphs are redrawn. Original CharStrings, glyph IDs, cmap,
features, and kerning remain intact. Half-unit centering is intentional when
advances differ by an odd number of units. Alternate outlines have no hints;
the original outlines and hints are untouched.
"""

from copy import deepcopy
from pathlib import Path

from fontTools.misc.roundTools import otRound
from fontTools.otlLib.builder import buildLookup, buildSingleSubstSubtable
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import otTables


FONT_DIR = Path(__file__).resolve().parents[1] / "public/fonts/open-runde"
WEIGHTS = ("Regular", "Medium", "Semibold", "Bold")


def language_systems(gsub):
    for record in gsub.ScriptList.ScriptRecord:
        script = record.Script
        if script.DefaultLangSys is not None:
            yield script.DefaultLangSys
        for language in script.LangSysRecord:
            yield language.LangSys


def add_tnum(font, mapping):
    gsub = font["GSUB"].table
    assert gsub.Version == 0x00010000, "Review feature variations before extending GSUB"
    records = gsub.FeatureList.FeatureRecord
    assert not any(record.FeatureTag == "tnum" for record in records)

    lookup_index = len(gsub.LookupList.Lookup)
    gsub.LookupList.Lookup.append(buildLookup([buildSingleSubstSubtable(mapping)]))
    gsub.LookupList.LookupCount = len(gsub.LookupList.Lookup)

    record = otTables.FeatureRecord()
    record.FeatureTag = "tnum"
    record.Feature = otTables.Feature()
    record.Feature.FeatureParams = None
    record.Feature.LookupListIndex = [lookup_index]
    record.Feature.LookupCount = 1
    # Feature records must remain alphabetically sorted. Lookup order stays intact.
    index = next((i for i, item in enumerate(records) if item.FeatureTag > "tnum"), len(records))
    records.insert(index, record)
    gsub.FeatureList.FeatureCount = len(records)
    for language in language_systems(gsub):
        language.FeatureIndex = [i + (i >= index) for i in language.FeatureIndex]
        language.FeatureIndex.append(index)
        language.FeatureIndex.sort()
        language.FeatureCount = len(language.FeatureIndex)
        if language.ReqFeatureIndex != 0xFFFF and language.ReqFeatureIndex >= index:
            language.ReqFeatureIndex += 1
    return index


def rename_derivative(font, weight):
    family = "Open Runde Tabular"
    full_name = f"{family} {weight}"
    postscript_name = f"OpenRundeTabular-{weight}"
    for name in font["name"].names:
        if name.nameID in (1, 16):
            value = family
        elif name.nameID == 3:
            value = name.toUnicode().replace(f"OpenRunde-{weight}", postscript_name)
        elif name.nameID == 4:
            value = full_name
        elif name.nameID == 6:
            value = postscript_name
        else:
            continue
        name.string = value.encode(name.getEncoding())
    cff = font["CFF "].cff
    cff.fontNames[0] = postscript_name
    cff.topDictIndex[0].FullName = full_name
    cff.topDictIndex[0].FamilyName = family


def outline(font, glyph, offset=0):
    pen = RecordingPen()
    font.getGlyphSet()[glyph].draw(TransformPen(pen, (1, 0, 0, 1, offset, 0)))
    return pen.value


def validate(source, output, mapping, width, tnum_index):
    """Validate the serialized WOFF2, not just the in-memory font."""
    original = TTFont(source, recalcTimestamp=False)
    generated = TTFont(output, recalcTimestamp=False)
    original_order = original.getGlyphOrder()
    assert generated.getGlyphOrder() == original_order + list(mapping.values())
    assert generated.getBestCmap() == original.getBestCmap()
    assert generated["head"].created == original["head"].created
    assert generated["head"].modified == original["head"].modified
    for tag in ("cmap", "GPOS", "GDEF", "OS/2"):
        assert generated[tag].compile(generated) == original[tag].compile(original), tag

    old_cff = original["CFF "].cff.topDictIndex[0]
    new_cff = generated["CFF "].cff.topDictIndex[0]
    assert new_cff.charset == generated.getGlyphOrder()
    assert len(new_cff.CharStrings.charStringsIndex) == len(generated.getGlyphOrder())
    assert new_cff.Notice == old_cff.Notice
    assert new_cff.Private.rawDict == old_cff.Private.rawDict
    for old_subrs, new_subrs in (
        (original["CFF "].cff.GlobalSubrs, generated["CFF "].cff.GlobalSubrs),
        (old_cff.Private.Subrs, new_cff.Private.Subrs),
    ):
        assert [s.bytecode for s in old_subrs] == [s.bytecode for s in new_subrs]
    for glyph in original_order:
        assert generated["hmtx"][glyph] == original["hmtx"][glyph], glyph
        assert new_cff.CharStrings[glyph].bytecode == old_cff.CharStrings[glyph].bytecode, glyph
    for glyph, alternate in mapping.items():
        advance, bearing = original["hmtx"][glyph]
        offset = (width - advance) / 2
        assert generated["hmtx"][alternate] == (width, otRound(bearing + offset))
        assert outline(original, glyph, offset) == outline(generated, alternate), alternate
        assert new_cff.CharStrings[alternate].width == width, alternate

    # Strip the one added feature/lookup and reverse index shifts: the entire
    # original GSUB must compile identically, including all language systems.
    restored = deepcopy(generated["GSUB"])
    gsub = restored.table
    feature = gsub.FeatureList.FeatureRecord.pop(tnum_index)
    assert feature.FeatureTag == "tnum"
    assert feature.Feature.LookupListIndex == [len(gsub.LookupList.Lookup) - 1]
    lookup = gsub.LookupList.Lookup.pop()
    assert lookup.LookupType == 1
    assert lookup.SubTable[0].mapping == mapping
    gsub.LookupList.LookupCount -= 1
    gsub.FeatureList.FeatureCount -= 1
    for language in language_systems(gsub):
        assert tnum_index in language.FeatureIndex
        language.FeatureIndex.remove(tnum_index)
        language.FeatureIndex = [i - (i > tnum_index) for i in language.FeatureIndex]
        language.FeatureCount -= 1
        if language.ReqFeatureIndex != 0xFFFF and language.ReqFeatureIndex > tnum_index:
            language.ReqFeatureIndex -= 1
    assert restored.compile(generated) == original["GSUB"].compile(original)

    renamed_ids = {1, 3, 4, 6, 16}
    old_names = [vars(n) for n in original["name"].names if n.nameID not in renamed_ids]
    new_names = [vars(n) for n in generated["name"].names if n.nameID not in renamed_ids]
    assert old_names == new_names, "Original attribution/metadata must be retained"
    original.close()
    generated.close()


def build(weight):
    source = FONT_DIR / f"OpenRunde-{weight}.woff2"
    output = FONT_DIR / f"OpenRunde-{weight}-Tabular.woff2"
    font = TTFont(source, recalcTimestamp=False)
    assert "CFF " in font, "This generator expects CFF outlines"
    digits = [font.getBestCmap()[codepoint] for codepoint in range(48, 58)]
    width = max(font["hmtx"][glyph][0] for glyph in digits)
    sources = list(digits)
    # The existing zero feature runs before our appended lookup. Give its
    # slashed-zero output an alternate too, so zero + tnum can be used together.
    gsub = font["GSUB"].table
    for record in gsub.FeatureList.FeatureRecord:
        if record.FeatureTag != "zero":
            continue
        for index in record.Feature.LookupListIndex:
            lookup = gsub.LookupList.Lookup[index]
            assert lookup.LookupType == 1
            for subtable in lookup.SubTable:
                for glyph in digits:
                    alternate = subtable.mapping.get(glyph)
                    if alternate is not None and alternate not in sources:
                        sources.append(alternate)

    mapping = {glyph: f"{glyph}.tnum" for glyph in sources}
    order = font.getGlyphOrder()[:]
    assert not set(mapping.values()).intersection(order)
    glyph_set = font.getGlyphSet()
    cff = font["CFF "].cff
    top = cff.topDictIndex[0]
    charstrings = top.CharStrings
    assert charstrings.charStringsAreIndexed
    for glyph, alternate in mapping.items():
        advance, bearing = font["hmtx"][glyph]
        offset = (width - advance) / 2
        private = charstrings[glyph].private
        pen = T2CharStringPen(width - private.nominalWidthX, glyph_set, roundTolerance=0)
        glyph_set[glyph].draw(TransformPen(pen, (1, 0, 0, 1, offset, 0)))
        charstring = pen.getCharString(private=private, globalSubrs=cff.GlobalSubrs)
        charstrings.charStrings[alternate] = len(charstrings.charStringsIndex)
        charstrings.charStringsIndex.append(charstring)
        top.charset.append(alternate)
        font["hmtx"].metrics[alternate] = (width, otRound(bearing + offset))
    font.setGlyphOrder(order + list(mapping.values()))
    font["maxp"].numGlyphs = len(font.getGlyphOrder())
    tnum_index = add_tnum(font, mapping)
    rename_derivative(font, weight)
    font.save(output)
    font.close()
    validate(source, output, mapping, width, tnum_index)
    print(f"{output.name}: verified {len(mapping)} alternates, {width}-unit advance")


if __name__ == "__main__":
    for weight in WEIGHTS:
        build(weight)
