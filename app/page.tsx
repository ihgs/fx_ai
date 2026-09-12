import { SwipeContainer } from "@/components/SwipeContainer";
import { CurrentRateScreen } from "@/components/CurrentRateScreen";
import { ChartScreen } from "@/components/ChartScreen";
import { AnalysisPlaceholder } from "@/components/AnalysisPlaceholder";

export default function Home() {
  return (
    <SwipeContainer>
      <CurrentRateScreen />
      <ChartScreen />
      <AnalysisPlaceholder />
    </SwipeContainer>
  );
}
