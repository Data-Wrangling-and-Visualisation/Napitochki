use strum_macros::{EnumIter, AsRefStr};


#[derive(EnumIter, AsRefStr, Debug)]
pub enum TasteCategories {
    SWEET, 
    SOUR, 
    BITTER, 
    SALTY, 
    UMAMI, 
    FRUITY, 
    FLORAL, 
    SPICY, 
    CREAMY, 
    TART, 
    REFRESHING, 
    RICH, 
    LIGHT, 
    EARTHY, 
    CITRUSY, 
    HERBAL, 
    MILKY, 
}
