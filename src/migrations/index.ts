import * as migration_20260713_113304_initial_schema from './20260713_113304_initial_schema';
import * as migration_20260804_140600_optional_participant_details from './20260804_140600_optional_participant_details';

export const migrations = [
  {
    up: migration_20260713_113304_initial_schema.up,
    down: migration_20260713_113304_initial_schema.down,
    name: '20260713_113304_initial_schema',
  },
  {
    up: migration_20260804_140600_optional_participant_details.up,
    down: migration_20260804_140600_optional_participant_details.down,
    name: '20260804_140600_optional_participant_details'
  },
];
