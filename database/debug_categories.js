/**
 * Debug script to check why categories fail to create
 * Run with: node debug_categories.js
 */

/* eslint-env node */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import process from "process";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const failingCategories = [
  "Antihistamine (First Generation)",
  "Dietary Supplement",
  "Iron Supplement",
  "Renal Supplement",
  "Antihypertensive",
  "Energy Supplement",
  "Brain Health Supplement",
  "Liver Health Supplement",
  "General Supplement",
  "Infant Supplement",
  "Electrolyte Supplement",
  "Statin/Cholesterol Lowering",
];

async function checkCategory(categoryName) {
  console.log(`\n🔍 Checking: "${categoryName}"`);
  console.log("─".repeat(60));

  // Check exact match (case-insensitive)
  const { data: exactMatch, error: exactError } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", categoryName)
    .maybeSingle();

  if (exactError) {
    console.error("❌ Error checking exact match:", exactError.message);
  } else if (exactMatch) {
    console.log(
      `✅ FOUND (Exact match): "${exactMatch.name}" (ID: ${exactMatch.id})`
    );
    console.log(`   Created: ${exactMatch.created_at}`);
    console.log(`   Active: ${exactMatch.is_active}`);
  } else {
    console.log("❌ NOT FOUND (Exact match)");
  }

  // Check with title case
  const titleCased = categoryName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  if (titleCased !== categoryName) {
    console.log(`\n🔄 Trying title case: "${titleCased}"`);
    const { data: titleMatch } = await supabase
      .from("categories")
      .select("*")
      .ilike("name", titleCased)
      .maybeSingle();

    if (titleMatch) {
      console.log(
        `✅ FOUND (Title case): "${titleMatch.name}" (ID: ${titleMatch.id})`
      );
    } else {
      console.log("❌ NOT FOUND (Title case)");
    }
  }

  // Check all similar names (fuzzy search)
  const { data: allCategories } = await supabase
    .from("categories")
    .select("name, id, is_active")
    .eq("is_active", true);

  const similar = allCategories?.filter((cat) => {
    const nameLower = cat.name.toLowerCase();
    const searchLower = categoryName.toLowerCase();
    return nameLower.includes(searchLower) || searchLower.includes(nameLower);
  });

  if (similar && similar.length > 0) {
    console.log(`\n📋 Similar categories found (${similar.length}):`);
    similar.forEach((cat) => {
      console.log(`   - "${cat.name}" (ID: ${cat.id})`);
    });
  }
}

async function getAllCategories() {
  console.log("\n📊 All existing categories in database:");
  console.log("=".repeat(60));

  const { data, error } = await supabase
    .from("categories")
    .select("name, id, is_active, created_at")
    .order("name");

  if (error) {
    console.error("❌ Error fetching categories:", error.message);
    return;
  }

  console.log(`Total categories: ${data.length}`);
  console.log("\nCategories list:");
  data.forEach((cat, index) => {
    const status = cat.is_active ? "✅" : "❌";
    console.log(`${index + 1}. ${status} "${cat.name}" (ID: ${cat.id})`);
  });
}

async function main() {
  console.log("🚀 Category Debug Tool");
  console.log("=".repeat(60));
  console.log(`Checking ${failingCategories.length} failing categories...\n`);

  // First, show all categories
  await getAllCategories();

  // Then check each failing category
  console.log("\n" + "=".repeat(60));
  console.log("🔍 Detailed check for each failing category:");
  console.log("=".repeat(60));

  for (const categoryName of failingCategories) {
    await checkCategory(categoryName);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Debug complete!");
  console.log("\n💡 Recommendations:");
  console.log(
    "   1. If categories exist with slightly different names, update your CSV"
  );
  console.log(
    "   2. If categories don't exist, check RLS policies on categories table"
  );
  console.log(
    "   3. Check browser console for the actual Supabase error message"
  );
}

main().catch(console.error);
