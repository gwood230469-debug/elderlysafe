package expo.modules.callscreening

import kotlin.math.max
import kotlin.math.min

// v1 heuristic, not a trained model — kept in numeric lockstep by hand with
// src/lib/scoreCallRisk.ts (the two can't share code: this runs in a Kotlin
// service process, that runs in the JS bundle / Deno edge function). If you
// change one, change the other. This is ONLY the offline fallback used when
// the score-call-risk network call fails or times out within onScreenCall's
// tight response budget — the network call is the primary path.
internal object RiskHeuristic {
  data class Result(val riskScore: Int, val riskReasons: List<String>)

  fun score(callerNumber: String, verificationStatus: String, contactMatch: Boolean, userRegion: String): Result {
    if (contactMatch) {
      return Result(8, listOf("Matches a saved contact"))
    }

    var score: Int
    val reasons = mutableListOf<String>()
    when (verificationStatus) {
      "passed" -> {
        score = 25
        reasons.add("STIR/SHAKEN verification passed")
      }
      "failed" -> {
        score = 75
        reasons.add("Caller ID verification failed — likely spoofed")
      }
      else -> {
        score = 45
        reasons.add("Caller ID could not be verified")
      }
    }

    if (userRegion.equals("GB", ignoreCase = true)) {
      val normalized = callerNumber.replace(Regex("[\\s\\-().]"), "")
      val looksUk = normalized.startsWith("+44") || normalized.startsWith("07") || normalized.startsWith("01") || normalized.startsWith("02")
      if (!looksUk) {
        score += 18
        reasons.add("Number format doesn't match your region")
      }
    }

    return Result(max(0, min(91, score)), reasons)
  }
}
