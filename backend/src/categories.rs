use strum_macros::{EnumIter, AsRefStr};

/// An enumeration of all supported taste profiles for drinks.
///
/// Use this to categorize and filter beverages by their dominant flavor notes.
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
