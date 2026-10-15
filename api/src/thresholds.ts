// Constants from SPEC section 7 only. Nitrite and the 15 °C feeding floor are not in this demo.

export const DO_TARGET_MIN_MGL = 3;
export const MOLASSES_MAX_GL = 0.12;
export const MOLASSES_BLOCK_IF_DO_BELOW_MGL = 3;
export const NH3_OPT_MGL = 0.05;
export const NH3_GROWTH_DEPRESS_MGL = 0.1;
export const PH_MIN = 7;
export const PH_MAX = 9;
export const TEMP_MIN_C = 22;
export const TEMP_MAX_C = 29;
export const AERATOR_DURATION_MIN = 15;
export const AERATOR_DURATION_MAX = 240;
export const CARB_G_PER_G_TAN = 20;
export const MOLASSES_CARB_FRACTION = 0.44;

export const SOURCE_MOLASSES_MAX = 'Pérez-Fuentes et al. 2016, Aquaculture 452';
export const SOURCE_DO = 'SDSU FS963-02 (Mjoun et al. 2010)';
export const SOURCE_NH3 = 'SDSU FS963-02 (Mjoun et al. 2010)';
export const SOURCE_CN = 'Avnimelech 1999; MOLASSES_CARB_FRACTION 0.44 (Silva 2017 and Avnimelech 1999)';
export const SOURCE_AERATOR_POLICY = 'Demo policy: aerator duration must be 15–240 minutes';
export const SOURCE_FEEDER_POLICY = 'Demo policy: feeder kg must be between 0 and ponds.max_feed_kg';
