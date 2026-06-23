import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

API_BASE = "http://localhost:8000/api"

st.set_page_config(
    page_title="DexMaster Admin Dashboard",
    page_icon="🎮",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .stApp { background-color: #0a0000; color: #ff8c00; }
    .metric-card {
        background: rgba(255,140,0,0.1);
        border: 1px solid rgba(255,140,0,0.3);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

st.title("🎮 DexMaster — Admin Analytics Dashboard")
st.markdown("---")

# Sidebar
st.sidebar.title("Navigation")
page = st.sidebar.selectbox(
    "Select View",
    ["Overview", "Leaderboard", "Question Analysis", "Category Performance", "Player Distribution", "Daily Activity", "Cluster Analysis"]
)

def fetch(endpoint):
    try:
        r = requests.get(f"{API_BASE}/{endpoint}", timeout=5)
        return r.json()
    except Exception as e:
        st.error(f"API Error: {e}")
        return None

# ── OVERVIEW ──
if page == "Overview":
    st.header("📊 Platform Overview")

    data = fetch("analytics/overview")
    if data:
        col1, col2, col3, col4, col5 = st.columns(5)
        col1.metric("Total Players", data["total_players"])
        col2.metric("Total Sessions", data["total_sessions"])
        col3.metric("Total Attempts", data["total_attempts"])
        col4.metric("WCS Champions", data["wcs_champions"])
        col5.metric("Overall Accuracy", f"{data['overall_accuracy_pct']}%")

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("🏆 Skill Distribution")
        dist = fetch("analytics/skill-distribution")
        if dist:
            df = pd.DataFrame(dist)
            fig = px.pie(
                df, values="count", names="rank",
                color_discrete_sequence=["#ff4500", "#ff8c00", "#ffd700", "#ff3300"],
                hole=0.4,
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#ff8c00",
            )
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("🐾 Personality Distribution")
        pdist = fetch("analytics/personality-distribution")
        if pdist:
            df = pd.DataFrame(pdist)
            fig = px.bar(
                df, x="personality", y="count",
                color="personality",
                color_discrete_sequence=px.colors.qualitative.Set2,
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#ff8c00",
                showlegend=False,
            )
            st.plotly_chart(fig, use_container_width=True)

# ── LEADERBOARD ──
elif page == "Leaderboard":
    st.header("🥇 Top Players Leaderboard")

    data = fetch("analytics/leaderboard")
    if data:
        df = pd.DataFrame(data)
        df.columns = ["Position", "Name", "Skill Score", "Rank", "Regions", "Personality", "WCS Champion"]
        df["WCS Champion"] = df["WCS Champion"].map({True: "✅", False: "❌"})

        st.dataframe(
            df,
            use_container_width=True,
            hide_index=True,
        )

        fig = px.bar(
            df, x="Name", y="Skill Score",
            color="Rank",
            title="Skill Score Comparison",
        )
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#ff8c00",
        )
        st.plotly_chart(fig, use_container_width=True)

# ── QUESTION ANALYSIS ──
elif page == "Question Analysis":
    st.header("❓ Hardest Questions")
    st.caption("Questions with highest failure rates globally")

    data = fetch("analytics/hardest-questions")
    if data:
        df = pd.DataFrame(data)
        if not df.empty:
            fig = px.bar(
                df.head(10),
                x="failure_pct",
                y="question_text",
                orientation="h",
                color="difficulty",
                color_continuous_scale="Reds",
                title="Top 10 Hardest Questions by Failure Rate",
                labels={"failure_pct": "Failure %", "question_text": "Question"},
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#ff8c00",
                height=500,
            )
            st.plotly_chart(fig, use_container_width=True)

            st.subheader("Detailed Table")
            display = df[["question_text", "category", "difficulty", "total_attempts", "failure_pct"]].copy()
            display.columns = ["Question", "Category", "Difficulty", "Total Attempts", "Failure %"]
            st.dataframe(display, use_container_width=True, hide_index=True)

# ── CATEGORY PERFORMANCE ──
elif page == "Category Performance":
    st.header("📂 Category Performance Analysis")

    data = fetch("analytics/category-performance")
    if data:
        df = pd.DataFrame(data)
        if not df.empty:
            col1, col2 = st.columns(2)

            with col1:
                fig = px.bar(
                    df.sort_values("accuracy_pct"),
                    x="accuracy_pct",
                    y="category",
                    orientation="h",
                    color="accuracy_pct",
                    color_continuous_scale="RdYlGn",
                    title="Accuracy by Category",
                    labels={"accuracy_pct": "Accuracy %", "category": "Category"},
                )
                fig.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font_color="#ff8c00",
                )
                st.plotly_chart(fig, use_container_width=True)

            with col2:
                fig2 = px.pie(
                    df, values="total_attempts", names="category",
                    title="Attempt Distribution by Category",
                )
                fig2.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font_color="#ff8c00",
                )
                st.plotly_chart(fig2, use_container_width=True)

            st.subheader("Category Summary Table")
            display = df[["category", "total_attempts", "correct", "accuracy_pct"]].copy()
            display.columns = ["Category", "Total Attempts", "Correct", "Accuracy %"]
            display = display.sort_values("Accuracy %")
            st.dataframe(display, use_container_width=True, hide_index=True)

# ── PLAYER DISTRIBUTION ──
elif page == "Player Distribution":
    st.header("👥 Player Distribution")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("By Rank")
        dist = fetch("analytics/skill-distribution")
        if dist:
            df = pd.DataFrame(dist)
            fig = px.pie(
                df, values="count", names="rank",
                hole=0.3,
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                font_color="#ff8c00",
            )
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("By Personality")
        pdist = fetch("analytics/personality-distribution")
        if pdist:
            df = pd.DataFrame(pdist)
            fig = px.bar(
                df, x="personality", y="count",
                color="personality",
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#ff8c00",
                showlegend=False,
            )
            st.plotly_chart(fig, use_container_width=True)

    st.subheader("Region Performance Comparison")
    region_data = fetch("analytics/region-performance")
    if region_data:
        df = pd.DataFrame(region_data)
        if not df.empty:
            fig = px.bar(
                df, x="region", y="accuracy_pct",
                color="accuracy_pct",
                color_continuous_scale="RdYlGn",
                title="Accuracy Rate per Region",
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#ff8c00",
            )
            st.plotly_chart(fig, use_container_width=True)

# ── DAILY ACTIVITY ──
elif page == "Daily Activity":
    st.header("📅 Daily Activity")

    data = fetch("analytics/daily-activity")
    if data:
        df = pd.DataFrame(data)
        if not df.empty:
            fig = px.line(
                df, x="date", y="sessions",
                title="Daily Sessions Over Time",
                markers=True,
                color_discrete_sequence=["#ff8c00"],
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#ff8c00",
            )
            st.plotly_chart(fig, use_container_width=True)

            st.metric("Total Days Active", len(df))
            st.metric("Peak Day Sessions", df["sessions"].max())
            st.metric("Average Daily Sessions", round(df["sessions"].mean(), 1))
        else:
            st.info("No activity data yet. Play some games first!")
            
# ── CLUSTER ANALYSIS ──
elif page == "Cluster Analysis":
    st.header("🧬 Player Personality Clustering")
    st.caption("K-Means unsupervised learning — discovers player archetypes from real behavioral data")

    col1, col2 = st.columns([2, 1])

    with col2:
        st.subheader("Run Clustering")
        st.write("Clusters all players with 5+ attempts into behavioral personality groups.")

        if st.button("🔄 Run K-Means Now", use_container_width=True):
            try:
                r = requests.post(f"{API_BASE}/analytics/run-clustering", timeout=15)
                result = r.json()
                st.session_state["cluster_result"] = result
                if result["status"] == "success":
                    st.success(f"Clustered {result['total_players_clustered']} players!")
                else:
                    st.warning(result.get("message", "Not enough data yet"))
            except Exception as e:
                st.error(f"Error: {e}")

        st.markdown("---")

        # Centroid summary table
        if "cluster_result" in st.session_state:
            result = st.session_state["cluster_result"]
            if result.get("status") == "success" and result.get("cluster_centroids"):
                st.subheader("Cluster Profiles")
                centroid_rows = []
                for cid, c in result["cluster_centroids"].items():
                    centroid_rows.append({
                        "Personality": c["personality"],
                        "Players": c["player_count"],
                        "Accuracy": f"{round(c['avg_accuracy'] * 100, 1)}%",
                        "Avg Time": f"{c['avg_time']}s",
                        "Lifeline Rate": f"{round(c['avg_lifeline_rate'] * 100, 1)}%",
                    })
                st.dataframe(
                    pd.DataFrame(centroid_rows),
                    use_container_width=True,
                    hide_index=True,
                )

    with col1:
        if "cluster_result" not in st.session_state:
            st.info("Click 'Run K-Means Now' to cluster players and see visualizations.")
        else:
            result = st.session_state["cluster_result"]

            if result.get("status") != "success":
                st.warning(result.get("message", "Need more player data to cluster."))
                st.info("Tip: Need at least 8 players each with 5+ question attempts.")

            elif result.get("clusters"):
                df = pd.DataFrame(result["clusters"])

                # ── SCATTER PLOT: Accuracy vs Speed colored by personality
                st.subheader("Accuracy vs Response Time by Cluster")
                fig1 = px.scatter(
                    df,
                    x="avg_time",
                    y="accuracy",
                    color="personality",
                    text="player_name",
                    title="Player Behavioral Clusters",
                    labels={
                        "avg_time": "Avg Response Time (seconds)",
                        "accuracy": "Accuracy (0-1)",
                    },
                    size_max=14,
                    opacity=0.85,
                )
                fig1.update_traces(
                    textposition="top center",
                    textfont=dict(size=10),
                    marker=dict(size=14),
                )
                fig1.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0.2)",
                    font_color="#ff8c00",
                    xaxis=dict(gridcolor="rgba(255,140,0,0.1)"),
                    yaxis=dict(gridcolor="rgba(255,140,0,0.1)"),
                    height=400,
                )
                st.plotly_chart(fig1, use_container_width=True)

                # ── SCATTER PLOT: Lifeline Rate vs Category Variance
                st.subheader("Lifeline Usage vs Category Consistency")
                fig2 = px.scatter(
                    df,
                    x="lifeline_rate",
                    y="category_variance",
                    color="personality",
                    text="player_name",
                    title="Lifeline Dependency vs Performance Consistency",
                    labels={
                        "lifeline_rate": "Lifeline Usage Rate (0-1)",
                        "category_variance": "Category Variance (inconsistency)",
                    },
                    opacity=0.85,
                )
                fig2.update_traces(
                    textposition="top center",
                    textfont=dict(size=10),
                    marker=dict(size=14),
                )
                fig2.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0.2)",
                    font_color="#ff8c00",
                    xaxis=dict(gridcolor="rgba(255,140,0,0.1)"),
                    yaxis=dict(gridcolor="rgba(255,140,0,0.1)"),
                    height=400,
                )
                st.plotly_chart(fig2, use_container_width=True)

                # ── BAR CHART: Personality distribution from clustering
                st.subheader("Discovered Personality Distribution")
                personality_counts = df["personality"].value_counts().reset_index()
                personality_counts.columns = ["Personality", "Count"]
                fig3 = px.bar(
                    personality_counts,
                    x="Personality",
                    y="Count",
                    color="Personality",
                    title="How many players belong to each discovered cluster",
                )
                fig3.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0.2)",
                    font_color="#ff8c00",
                    showlegend=False,
                    height=300,
                )
                st.plotly_chart(fig3, use_container_width=True)

                # ── RAW DATA TABLE
                st.subheader("All Players — Cluster Assignments")
                display_df = df[[
                    "player_name", "personality", "cluster_id",
                    "accuracy", "avg_time", "lifeline_rate", "category_variance"
                ]].copy()
                display_df.columns = [
                    "Player", "Personality", "Cluster",
                    "Accuracy", "Avg Time (s)", "Lifeline Rate", "Category Variance"
                ]
                display_df["Accuracy"] = display_df["Accuracy"].apply(lambda x: f"{round(x*100,1)}%")
                display_df["Lifeline Rate"] = display_df["Lifeline Rate"].apply(lambda x: f"{round(x*100,1)}%")
                st.dataframe(display_df, use_container_width=True, hide_index=True)