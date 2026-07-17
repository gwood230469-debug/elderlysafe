package expo.modules.callscreening

import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

// Calls the score-call-risk Supabase Edge Function. Deliberately short
// timeouts and a single attempt — this runs off CallScreeningService's
// ring-time critical path (the call is already ringing normally by the
// time this executes), but the risk notification still needs to land
// promptly, and RiskHeuristic.score() is always available as a fallback if
// this fails or times out for any reason.
internal object RiskApiClient {
  private const val CONNECT_TIMEOUT_MS = 4000
  private const val READ_TIMEOUT_MS = 4000

  fun score(
    config: CallScreeningPrefs.Config,
    callerNumber: String,
    verificationStatus: String,
    contactMatch: Boolean
  ): RiskHeuristic.Result? {
    return try {
      val url = URL("${config.supabaseUrl.trimEnd('/')}/functions/v1/score-call-risk")
      val connection = url.openConnection() as HttpURLConnection
      connection.requestMethod = "POST"
      connection.connectTimeout = CONNECT_TIMEOUT_MS
      connection.readTimeout = READ_TIMEOUT_MS
      connection.doOutput = true
      connection.setRequestProperty("Content-Type", "application/json")
      connection.setRequestProperty("Authorization", "Bearer ${config.supabaseAnonKey}")
      connection.setRequestProperty("apikey", config.supabaseAnonKey)

      val body = JSONObject().apply {
        put("callerNumber", callerNumber)
        put("verificationStatus", verificationStatus)
        put("contactMatch", contactMatch)
        put("userRegion", config.userRegion)
      }

      OutputStreamWriter(connection.outputStream).use { it.write(body.toString()) }

      if (connection.responseCode !in 200..299) {
        connection.disconnect()
        return null
      }

      val responseText = connection.inputStream.bufferedReader().use { it.readText() }
      connection.disconnect()
      val json = JSONObject(responseText)
      val riskScore = json.optInt("riskScore", -1)
      if (riskScore < 0) return null
      val reasonsJson: JSONArray = json.optJSONArray("riskReasons") ?: JSONArray()
      val reasons = (0 until reasonsJson.length()).map { reasonsJson.getString(it) }
      RiskHeuristic.Result(riskScore, reasons)
    } catch (e: Exception) {
      null
    }
  }
}
