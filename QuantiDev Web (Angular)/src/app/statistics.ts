//  Adapted from QuantiDev, Correlation.swift

export enum PositiveNegative {

    Positive,
    Negative

}

export enum Classification {

    None,
    Weak,
    Moderate,
    Strong

}

export class StatisticsAnalysis {

    sign : PositiveNegative;
    classification : Classification;

}

export class StatisticsResult {

    result : number;
    analysis : StatisticsAnalysis;

    humanReadableAnalysis() {
        if (this.analysis.classification == Classification.None)
            return "The two selected variables do not appear to be associated";

        var analysisResult = "";

        if (this.analysis.classification == Classification.Weak)
            analysisResult = "weak";

        if (this.analysis.classification == Classification.Moderate)
            analysisResult = "moderate";

        if (this.analysis.classification == Classification.Strong)
            analysisResult = "strong";

        return "The two selected variables appear to be " + ((this.analysis.sign == PositiveNegative.Positive) ? "positively" : "negatively")
            + " associated in a " + analysisResult + " manner.";
    }

}

export class Statistics {

    //  Pearson Correlation adapted from https://stackoverflow.com/a/41089665

    static pearsonAnalyze(result : number) : StatisticsResult {
        var res = new StatisticsResult();

        res.result = result;

        var analysis : StatisticsAnalysis = {
            sign: (result > 0 ? PositiveNegative.Positive : PositiveNegative.Negative),
            classification: (() => {

                var locResult = result;

                if (result < 0)
                    result *= -1;

                if (result < 0.1)
                    return Classification.None;

                if (result < 0.3)
                    return Classification.Weak;

                if (result < 0.5)
                    return Classification.Moderate;

                return Classification.Strong;

            })()
        };

        res.analysis = analysis;

        return res;
    }

    static pearsonCorrelation(x, y) : number {
        let sumX = 0,
            sumY = 0,
            sumXY = 0,
            sumX2 = 0,
            sumY2 = 0;

        const minLength = x.length = y.length = Math.min(x.length, y.length),
            reduce = (xi, idx) => {
                const yi = y[idx];
                sumX += xi;
                sumY += yi;
                sumXY += xi * yi;
                sumX2 += xi * xi;
                sumY2 += yi * yi;
            }

        x.forEach(reduce);

        return (minLength * sumXY - sumX * sumY) / Math.sqrt((minLength * sumX2 - sumX * sumX) * (minLength * sumY2 - sumY * sumY));
    }

}
