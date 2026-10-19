package openapi;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// Job nocturno: toda la regresión, en paralelo.
class OpenApiRunner {

    @Test
    void regression() {
        Results results = Runner.path("classpath:openapi")
                .tags("~@ignore")
                .outputCucumberJson(true)
                .parallel(4);
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}
