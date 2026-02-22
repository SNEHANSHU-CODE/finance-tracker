import { gql } from '@apollo/client';

// COMPREHENSIVE QUERY - Get ALL analytics data in one request
export const GET_ALL_ANALYTICS = gql`
  query GetAllAnalytics($startDate: String!, $endDate: String!) {
    # 1. Dashboard Overview
    dashboard(startDate: $startDate, endDate: $endDate) {
      monthly {
        summary {
          totalIncome
          totalExpenses
          netSavings
          savingsRate
        }
      }
      recent {
        id
        description
        category
        date
        amount
      }
      generatedAt
    }

    # 2. Spending Trends
    spendingTrends(startDate: $startDate, endDate: $endDate) {
      trends {
        monthYear
        totalIncome
        totalExpenses
        netSavings
      }
      averageMonthlySpending
      totalSpending
      period
    }

    # 3. Category Analysis
    categoryAnalysis(startDate: $startDate, endDate: $endDate) {
      categories {
        category
        amount
        percentage
      }
      totalAmount
      period
    }

    # 4. Goals Progress
    goalsProgress {
      goals {
        id
        name
        progress
        savedAmount
        targetAmount
        deadline
        status
      }
      summary {
        totalGoals
        onTrackGoals
        overdueGoals
        averageProgress
      }
    }

    # 5. Income Trends
    incomeTrends(startDate: $startDate, endDate: $endDate) {
      trends {
        monthYear
        totalIncome
      }
      averageMonthlyIncome
    }

    # 6. Savings Trends
    savingsTrends(startDate: $startDate, endDate: $endDate) {
      trends {
        monthYear
        savings
        savingsRate
      }
      averageMonthlySavings
      totalSavings
      bestMonth {
        month
        amount
      }
      period
    }

    # 7. Transaction Insights
    transactionInsights(startDate: $startDate, endDate: $endDate) {
      period
      totalTransactions
      dailyAverage
      maxTransaction {
        amount
        description
        date
      }
      minTransaction {
        amount
        description
        date
      }
      averagePerDay
      mostUsedPaymentMethod
      topCategory
    }

    # 8. Budget Performance
    budgetPerformance(startDate: $startDate, endDate: $endDate) {
      message
      categories {
        category
        budgeted
        spent
        remaining
        percentageUsed
        status
      }
      overallPerformance
      recommendations
    }

    # 9. Current Month Analytics
    currentMonthAnalytics {
      year
      month
      summary {
        totalIncome
        totalExpenses
        netSavings
        savingsRate
      }
      categoryBreakdown {
        category
        amount
        percentage
      }
    }
  }
`;

// Individual queries (kept for backward compatibility or specific use cases)
export const GET_DASHBOARD_OVERVIEW = gql`
  query GetDashboardOverview($startDate: String!, $endDate: String!) {
    dashboard(startDate: $startDate, endDate: $endDate) {
      monthly {
        summary {
          totalIncome
          totalExpenses
          netSavings
          savingsRate
        }
      }
      recent {
        id
        description
        category
        date
        amount
      }
    }
  }
`;

// Spending Trends Query
export const GET_SPENDING_TRENDS = gql`
  query GetSpendingTrends($startDate: String!, $endDate: String!) {
    spendingTrends(startDate: $startDate, endDate: $endDate) {
      trends {
        monthYear
        totalIncome
        totalExpenses
        netSavings
      }
      averageMonthlySpending
      totalSpending
      period
    }
  }
`;

// Category Analysis Query
export const GET_CATEGORY_ANALYSIS = gql`
  query GetCategoryAnalysis($startDate: String!, $endDate: String!) {
    categoryAnalysis(startDate: $startDate, endDate: $endDate) {
      categories {
        category
        amount
        percentage
      }
      totalAmount
      period
    }
  }
`;

// Goals Progress Query
export const GET_GOALS_PROGRESS = gql`
  query GetGoalsProgress {
    goalsProgress {
      goals {
        id
        name
        progress
        savedAmount
        targetAmount
        deadline
        status
      }
      summary {
        totalGoals
        onTrackGoals
        overdueGoals
        averageProgress
      }
    }
  }
`;

// Income Trends Query
export const GET_INCOME_TRENDS = gql`
  query GetIncomeTrends($startDate: String!, $endDate: String!) {
    incomeTrends(startDate: $startDate, endDate: $endDate) {
      trends {
        monthYear
        totalIncome
      }
      averageMonthlyIncome
    }
  }
`;

// Monthly Analytics Query
export const GET_MONTHLY_ANALYTICS = gql`
  query GetMonthlyAnalytics($year: Int!, $month: Int!) {
    monthlyAnalytics(year: $year, month: $month) {
      year
      month
      summary {
        totalIncome
        totalExpenses
        netSavings
        savingsRate
      }
      categoryBreakdown {
        category
        amount
        percentage
      }
      dailyTrends {
        day
        income
        expenses
      }
    }
  }
`;

// Current Month Analytics Query
export const GET_CURRENT_MONTH_ANALYTICS = gql`
  query GetCurrentMonthAnalytics {
    currentMonthAnalytics {
      year
      month
      summary {
        totalIncome
        totalExpenses
        netSavings
        savingsRate
      }
      categoryBreakdown {
        category
        amount
        percentage
      }
    }
  }
`;

// Spending Comparison Query
export const GET_SPENDING_COMPARISON = gql`
  query GetSpendingComparison(
    $period1Start: String!
    $period1End: String!
    $period2Start: String!
    $period2End: String!
  ) {
    spendingComparison(
      period1Start: $period1Start
      period1End: $period1End
      period2Start: $period2Start
      period2End: $period2End
    ) {
      period1 {
        totalSpending
        categoryBreakdown {
          category
          amount
        }
      }
      period2 {
        totalSpending
        categoryBreakdown {
          category
          amount
        }
      }
      changes {
        totalChange
        categoryChanges {
          category
          change
          percentage
        }
      }
    }
  }
`;

// Income Sources Query
export const GET_INCOME_SOURCES = gql`
  query GetIncomeSources($startDate: String!, $endDate: String!) {
    incomeSources(startDate: $startDate, endDate: $endDate) {
      sources {
        source
        amount
        percentage
        transactionCount
      }
      totalIncome
    }
  }
`;

// Transaction Insights Query
export const GET_TRANSACTION_INSIGHTS = gql`
  query GetTransactionInsights($startDate: String!, $endDate: String!) {
    transactionInsights(startDate: $startDate, endDate: $endDate) {
      period
      totalTransactions
      dailyAverage
      maxTransaction {
        amount
        description
        date
      }
      minTransaction {
        amount
        description
        date
      }
      averagePerDay
      mostUsedPaymentMethod
      topCategory
    }
  }
`;

// Transaction Patterns Query
export const GET_TRANSACTION_PATTERNS = gql`
  query GetTransactionPatterns($startDate: String!, $endDate: String!) {
    transactionPatterns(startDate: $startDate, endDate: $endDate) {
      weeklyPattern {
        dayOfWeek
        averageAmount
        transactionCount
      }
      mostActiveDay
      period
    }
  }
`;

// Savings Rate Query
export const GET_SAVINGS_RATE = gql`
  query GetSavingsRate($startDate: String!, $endDate: String!) {
    savingsRate(startDate: $startDate, endDate: $endDate) {
      rate
      totalSavings
      totalIncome
      totalExpenses
      period
    }
  }
`;

// Savings Trends Query
export const GET_SAVINGS_TRENDS = gql`
  query GetSavingsTrends($startDate: String!, $endDate: String!) {
    savingsTrends(startDate: $startDate, endDate: $endDate) {
      trends {
        monthYear
        savings
        savingsRate
      }
      averageMonthlySavings
      totalSavings
      bestMonth {
        month
        amount
      }
      period
    }
  }
`;

// Budget Performance Query
export const GET_BUDGET_PERFORMANCE = gql`
  query GetBudgetPerformance($startDate: String!, $endDate: String!) {
    budgetPerformance(startDate: $startDate, endDate: $endDate) {
      message
      categories {
        category
        budgeted
        spent
        remaining
        percentageUsed
        status
      }
      overallPerformance
      recommendations
    }
  }
`;

// Budget Variance Query
export const GET_BUDGET_VARIANCE = gql`
  query GetBudgetVariance($startDate: String!, $endDate: String!) {
    budgetVariance(startDate: $startDate, endDate: $endDate) {
      categories {
        category
        variance
        percentageVariance
      }
      overallVariance
      period
    }
  }
`;

// Cash Flow Analysis Query
export const GET_CASH_FLOW_ANALYSIS = gql`
  query GetCashFlowAnalysis($startDate: String!, $endDate: String!) {
    cashFlowAnalysis(startDate: $startDate, endDate: $endDate) {
      inflows {
        monthYear
        amount
      }
      outflows {
        monthYear
        amount
      }
      netFlow {
        monthYear
        amount
      }
      period
    }
  }
`;

// Financial Health Query
export const GET_FINANCIAL_HEALTH = gql`
  query GetFinancialHealth($startDate: String!, $endDate: String!) {
    financialHealth(startDate: $startDate, endDate: $endDate) {
      score
      metrics {
        savingsRate
        debtToIncome
        emergencyFundMonths
        budgetAdherence
      }
      recommendations
      period
    }
  }
`;

// Spending Forecast Query
export const GET_SPENDING_FORECAST = gql`
  query GetSpendingForecast($months: Int!) {
    spendingForecast(months: $months) {
      forecast {
        month
        predictedAmount
        confidenceInterval {
          lower
          upper
        }
      }
      trend
      accuracy
    }
  }
`;

// Income Forecast Query
export const GET_INCOME_FORECAST = gql`
  query GetIncomeForecast($months: Int!) {
    incomeForecast(months: $months) {
      forecast {
        month
        predictedAmount
        confidenceInterval {
          lower
          upper
        }
      }
      trend
      accuracy
    }
  }
`;

// Goals Summary Query
export const GET_GOALS_SUMMARY = gql`
  query GetGoalsSummary {
    goalsSummary {
      totalGoals
      completedGoals
      activeGoals
      totalTargetAmount
      totalSavedAmount
      overallProgress
      projectedCompletionDate
    }
  }
`;

// Chart Data Query (Generic)
export const GET_CHART_DATA = gql`
  query GetChartData($chartType: String!, $params: ChartParamsInput!) {
    chartData(chartType: $chartType, params: $params) {
      chartType
      data
      labels
      metadata
    }
  }
`;

// Health Check Query
export const HEALTH_CHECK = gql`
  query HealthCheck {
    analyticsHealth {
      status
      timestamp
      version
    }
  }
`;

// Batch Analytics Query
export const GET_BATCH_ANALYTICS = gql`
  query GetBatchAnalytics($requests: [AnalyticsRequestInput!]!) {
    batchAnalytics(requests: $requests) {
      requestId
      data
      error
    }
  }
`;