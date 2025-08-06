# Car Manual Documentation

This directory contains references and documentation for the vehicle specifications used in the tire maintenance system.

## Manual Sources

The data in `car_manual_specs.csv` is compiled from official manufacturer sources. For verification, testers should reference the original manufacturer documentation.

## How to Verify Data

1. **Official Manufacturer Websites**
   - Toyota: https://www.toyota.com/owners/
   - Honda: https://owners.honda.com/
   - Ford: https://owner.ford.com/
   - BMW: https://www.bmwusa.com/owners/
   - Mercedes-Benz: https://www.mbusa.com/owners/

2. **Owner's Manual Sections to Check**
   - Tire and Loading Information (usually Chapter 8-9)
   - Maintenance Schedule (usually Chapter 7)
   - Vehicle Specifications (usually Appendix)

3. **Key Specifications to Verify**
   - Recommended tire pressure (door jamb sticker)
   - Tire size and load rating
   - Rotation intervals
   - Minimum tread depth requirements

## Data Verification Checklist

For each vehicle model, verify:
- [ ] Tire size matches OEM specification
- [ ] Recommended PSI matches door jamb sticker
- [ ] Load index and speed rating are correct
- [ ] Rotation interval matches maintenance schedule
- [ ] Vehicle weight is within manufacturer specs

## Legal Notice

This project uses publicly available vehicle specifications for educational and demonstration purposes. All data should be verified against official manufacturer documentation before use in production systems.

## Adding New Vehicles

To add new vehicle specifications:

1. Obtain official manufacturer documentation
2. Extract tire and maintenance specifications
3. Add entry to `car_manual_specs.csv`
4. Document source in `manual_sources.csv`
5. Update this README with verification steps