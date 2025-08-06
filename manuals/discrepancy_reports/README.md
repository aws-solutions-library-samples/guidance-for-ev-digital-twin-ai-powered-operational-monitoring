# Discrepancy Reports

This directory contains reports of discrepancies found between our database and official manufacturer sources.

## Report Format

Each discrepancy report should follow this format:

```markdown
# Discrepancy Report: [YYYY-MM-DD] [Make] [Model] [Year]

## Issue Summary
Brief description of the discrepancy found.

## Vehicle Details
- Make: [Make]
- Model: [Model]  
- Year: [Year]
- VIN (if available): [VIN]

## Current Database Values
- Tire Size: [Current Value]
- Recommended Pressure: [Current Value]
- Min Tread Depth: [Current Value]
- Other affected fields...

## Correct Values (from official source)
- Tire Size: [Correct Value]
- Recommended Pressure: [Correct Value]
- Min Tread Depth: [Correct Value]
- Other corrected fields...

## Source Documentation
- Source Type: [Owner's Manual / Door Sticker / Manufacturer Website]
- Source URL: [URL if applicable]
- Page Reference: [Page number or section]
- Verification Date: [Date]
- Verified By: [Name/ID]

## Supporting Evidence
- [ ] Screenshot of manual page
- [ ] Photo of door jamb sticker
- [ ] Manufacturer website screenshot
- [ ] Other documentation

## Resolution
- [ ] Database updated
- [ ] Source reference updated
- [ ] Verification date updated
- [ ] Change logged in changelog

## Notes
Any additional context or observations.
```

## Example Report

See `2025-01-08_toyota_camry_2020_example.md` for a sample discrepancy report.

## Naming Convention

Reports should be named: `YYYY-MM-DD_make_model_year_issue.md`

Examples:
- `2025-01-08_toyota_camry_2020_pressure.md`
- `2025-01-08_bmw_x5_2022_tire_size.md`
- `2025-01-08_ford_f150_2021_rotation_interval.md`