// Place this file at: Models/ActivityTag.cs
namespace MoodSimBackend.Models
{
    /// <summary>
    /// What role an activity plays in the day, independent of how it feels moment-to-moment.
    /// This is what lets the day-narrative layer distinguish "gaming after work" (earned)
    /// from "gaming after an argument" (coping) without hardcoding every event combination.
    /// </summary>
    public enum ActivityFunction
    {
        Restorative,        // recharges you: relaxing, watching TV, reading, eating, sleeping
        DrainingNecessary,  // costs energy but is productive/required: work, exercise
        DrainingNegative,   // costs energy and is bad: arguing, feeling sick
        NeutralRoutine      // doesn't move the needle much: cooking, cleaning, getting ready
    }

    public class ActivityTag
    {
        public float BaseValence { get; set; }     // roughly -1 (bad) to +1 (good), how it feels in the moment
        public ActivityFunction Function { get; set; }

        public ActivityTag(float baseValence, ActivityFunction function)
        {
            BaseValence = baseValence;
            Function = function;
        }
    }
}
