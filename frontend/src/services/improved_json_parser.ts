/**
 * Improved JSON parser for Gemini API responses
 * Handles various edge cases and malformed JSON
 */
export class ImprovedJsonParser {
  static parseJsonResponse(rawResponse: string): any {
    try {
      console.log("🔄 Attempting to parse JSON from raw response");

      // First, try to parse the entire response as JSON
      try {
        const directParse = JSON.parse(rawResponse);
        console.log("✅ Successfully parsed entire response as JSON");
        return directParse;
      } catch (directError) {
        console.log("⚠️ Direct JSON parse failed, trying extraction methods");
      }

      // Clean the response first
      let cleanedResponse = rawResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^\s*Here's?\s+.*?:\s*/i, "")
        .replace(/^\s*[\w\s:]*\n/, "")
        .trim();

      // Try different extraction strategies
      const strategies = [
        // Strategy 1: Direct parse of cleaned response
        () => {
          return JSON.parse(cleanedResponse);
        },

        // Strategy 2: Extract JSON blocks between triple backticks
        () => {
          const codeBlockRegex = /```(?:json)?\n?([\s\S]*?)\n?```/;
          const match = rawResponse.match(codeBlockRegex);
          if (match) {
            const jsonContent = match[1].trim();
            console.log("Found JSON in code block:", jsonContent.substring(0, 100) + "...");
            return JSON.parse(jsonContent);
          }
          throw new Error("No code block found");
        },

        // Strategy 3: Extract JSON between curly braces (find largest valid JSON)
        () => {
          const braceMatches = rawResponse.match(/\{[\s\S]*?\}/g);
          if (braceMatches) {
            // Try largest match first
            const sortedMatches = braceMatches.sort((a, b) => b.length - a.length);
            for (const match of sortedMatches) {
              try {
                const result = JSON.parse(match);
                console.log("Found valid JSON in braces:", match.substring(0, 100) + "...");
                return result;
              } catch (e) {
                continue;
              }
            }
          }
          throw new Error("No valid JSON braces found");
        },

        // Strategy 4: Extract JSON between square brackets (for arrays)
        () => {
          const arrayMatches = rawResponse.match(/\[[\s\S]*?\]/g);
          if (arrayMatches) {
            // Try largest match first
            const sortedMatches = arrayMatches.sort((a, b) => b.length - a.length);
            for (const match of sortedMatches) {
              try {
                const result = JSON.parse(match);
                console.log("Found valid JSON array:", match.substring(0, 100) + "...");
                return result;
              } catch (e) {
                continue;
              }
            }
          }
          throw new Error("No valid JSON array found");
        },

        // Strategy 5: Try to fix common JSON issues
        () => {
          let fixedJson = cleanedResponse
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Fix unquoted keys
            .replace(/:\s*'([^']*)'/g, ': "$1"') // Fix single quotes
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
            .replace(/[\u0000-\u001f\u007f-\u009f]/g, ""); // Remove control characters
          
          return JSON.parse(fixedJson);
        },

        // Strategy 6: Extract structured data with specific patterns
        () => {
          const patterns = [
            /{\s*"title"[\s\S]*?(?=\n\n|\n$|$)}/,
            /{\s*"question"[\s\S]*?(?=\n\n|\n$|$)}/,
            /{\s*"topic"[\s\S]*?(?=\n\n|\n$|$)}/,
            /\[\s*{[\s\S]*?}\s*\]/
          ];
          
          for (const pattern of patterns) {
            const match = rawResponse.match(pattern);
            if (match) {
              try {
                const jsonContent = match[0];
                const result = JSON.parse(jsonContent);
                console.log("Found structured data:", jsonContent.substring(0, 100) + "...");
                return result;
              } catch (e) {
                continue;
              }
            }
          }
          throw new Error("No structured data found");
        }
      ];

      // Try each strategy
      for (const strategy of strategies) {
        try {
          const result = strategy();
          if (result) {
            console.log(
              "✅ Successfully parsed JSON using extraction strategy"
            );
            return result;
          }
        } catch (error) {
          continue;
        }
      }

      console.error("❌ All JSON parsing strategies failed");
      throw new Error("Unable to parse JSON from response");
    } catch (error) {
      console.error("❌ JSON parsing failed:", error);
      console.log(
        "📄 Problematic response:",
        rawResponse.substring(0, 500) + "..."
      );
      throw new Error(
        `JSON parsing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
