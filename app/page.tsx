import { SwipeContainer } from "@/components/SwipeContainer";
import { CurrentRateScreen } from "@/components/CurrentRateScreen";
import { ChartScreen } from "@/components/ChartScreen";
import { AnalysisScreen } from "@/components/AnalysisScreen";

export default function Home() {
  return (
    <SwipeContainer>
      <CurrentRateScreen />
      <ChartScreen />
      <AnalysisScreen />
    </SwipeContainer>
  );
}
