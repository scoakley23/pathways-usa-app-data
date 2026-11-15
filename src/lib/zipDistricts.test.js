// The Census ZIP → district table (src/data/zipDistricts.json) and its lookup.
import { describe, it, expect } from 'vitest';
import TABLE from '../data/zipDistricts.json';
import { buildZipIndex, districtFromIndex, districtForZip } from './zipDistricts';
import { parseRelationship, districtCode } from '../../scripts/districts/build-zip-districts.mjs';
import { validateLocation } from './officeholders';

const INDEX = buildZipIndex(TABLE);

describe('the ZIP table', () => {
  it('is the current Congress and covers every state, D.C. and the territories', () => {
    expect(TABLE.meta.congress).toBe(119);
    expect(Object.keys(TABLE.states)).toHaveLength(56);
    expect(INDEX.size).toBe(TABLE.meta.zips);
  });

  it('every state and district in it exists in the officeholders table', () => {
    const bad = [];
    for (const [state, districts] of Object.entries(TABLE.states)) {
      for (const district of Object.keys(districts)) {
        if (!validateLocation({ state, district }).ok) bad.push(`${state}-${district}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('districtForZip', () => {
  it('one district', async () => {
    expect(await districtForZip('10001')).toEqual({ state: 'NY', district: '12' });
    expect(await districtForZip('78701-1234')).toEqual({ state: 'TX', district: '37' });
  });

  it('at-large states, D.C. and territories', () => {
    expect(districtFromIndex(INDEX, '05401')).toEqual({ state: 'VT', district: 'At-large' });
    expect(districtFromIndex(INDEX, '20001')).toEqual({ state: 'DC', district: 'At-large' });
    expect(districtFromIndex(INDEX, '00901')).toEqual({ state: 'PR', district: 'At-large' });
    expect(districtFromIndex(INDEX, '96910')).toEqual({ state: 'GU', district: 'At-large' });
  });

  it('a split ZIP asks for the address; one across states too', () => {
    expect(districtFromIndex(INDEX, '75001')).toEqual({ state: 'TX', split: true });
    expect(districtFromIndex(INDEX, '30165')).toEqual({ split: true });
  });

  it('not a Census ZIP area, or not a ZIP', () => {
    expect(districtFromIndex(INDEX, '20500')).toBeNull();
    expect(districtFromIndex(INDEX, 'abcde')).toBeNull();
    expect(districtFromIndex(INDEX, '')).toBeNull();
  });
});

describe('build-zip-districts.mjs', () => {
  const HEAD = 'OID_CD119_20|GEOID_CD119_20|NAMELSAD_CD119_20|AREALAND_CD119_20|AREAWATER_CD119_20|MTFCC_CD119_20|FUNCSTAT_CD119_20|OID_ZCTA5_20|GEOID_ZCTA5_20|NAMELSAD_ZCTA5_20|AREALAND_ZCTA5_20|AREAWATER_ZCTA5_20|MTFCC_ZCTA5_20|CLASSFP_ZCTA5_20|FUNCSTAT_ZCTA5_20|AREALAND_PART|AREAWATER_PART';
  const row = (cd, zip, land) => `x|${cd}|n|1|0|G|N|y|${zip}|z|1|0|G|B5|S|${land}|0`;

  it('reads districts, drops water-only parts and the "ZZ" water code', () => {
    const text = [HEAD, row('4824', '75001', 10), row('4832', '75001', 5), row('4832', '75002', 0), row('48ZZ', '75003', 9), row('1198', '20001', 7), row('5000', '05401', 3), row('0101', '', 9)].join('\n');
    expect(parseRelationship(text, '119')).toEqual({
      DC: { 'At-large': '20001' },
      TX: { 24: '75001', 32: '75001' },
      VT: { 'At-large': '05401' },
    });
  });

  it('district codes', () => {
    expect(districtCode('00')).toBe('At-large');
    expect(districtCode('98')).toBe('At-large');
    expect(districtCode('07')).toBe('7');
    expect(districtCode('ZZ')).toBeNull();
  });

  it('refuses a file from another Congress', () => {
    expect(() => parseRelationship(HEAD, '120')).toThrow(/120th Congress/);
  });
});
